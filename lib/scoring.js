import { completeJSON } from "./openai";
import { tavilySearch } from "./tavily";
import { getGithubUserSignal } from "./sourcing/github";
import { getScoringWeights } from "./config";

// --- 1. Extraction --------------------------------------------------------
// Turn raw deck text (+ whatever else the founder supplied) into structured,
// atomic claims. Each claim is later independently trust-scored.
export async function extractClaims({ companyName, deckText, extra }) {
  const system = `You are an analyst extracting structured facts from a startup pitch deck for a
VC diligence system. Extract only what's actually stated — never invent numbers, names, or
dates. For anything not present, omit it or mark it explicitly missing. Return strict JSON.`;

  const user = `Company: ${companyName}

Deck text:
"""${(deckText || "").slice(0, 12000)}"""

Extra founder-supplied info:
"""${extra || "none"}"""

Return JSON with this shape:
{
  "snapshot": { "market": str, "problem": str, "urgency": str, "solution": str } | null,
  "team": { "founders": [{ "name": str, "background": str }], "single_founder": bool } | null,
  "market_sizing": { "tam": str, "sam": str, "som": str, "assumptions": str } | null,
  "competition": [{ "name": str, "differentiation": str }],
  "traction": { "customers": str, "revenue": str, "growth": str, "usage_metrics": str } | null,
  "financials_mentioned": bool,
  "cap_table_mentioned": bool,
  "claims": [
    { "id": str, "category": "traction"|"revenue"|"team"|"market_size"|"other", "text": str }
  ]
}`;

  return completeJSON({ system, user });
}

// --- 2. Trust Score (per claim, not per company) --------------------------
export async function verifyClaims({ claims, companyName }) {
  const weights = getScoringWeights();
  const levels = weights.trust_confidence_levels;
  const results = [];

  for (const claim of (claims || []).slice(0, 6)) {
    const { results: webResults } = await tavilySearch(`${companyName} ${claim.text}`, {
      maxResults: 3,
    });

    const system = `You are a diligence verifier. Given a claim from a startup pitch deck and web
search results, decide the claim's trust level from this exact set: ${JSON.stringify(levels)}.
"contradicted" means a source directly conflicts with the claim. "verified" means an independent
source corroborates it. Be conservative — default to "unverifiable" or "plausible" over "verified"
absent clear corroboration. Return strict JSON.`;

    const user = `Claim: "${claim.text}"

Web search results:
${webResults.map((r) => `- ${r.title}: ${r.content?.slice(0, 300)}`).join("\n") || "(no results)"}

Return JSON: { "confidence": "<one of the levels>", "evidence": "<one-line reason citing a result or 'no external source found'>", "sourceUrl": "<best matching result url or null>" }`;

    const verdict = await completeJSON({ system, user });
    results.push({ ...claim, ...verdict });
  }

  return results;
}

// Maps an unbounded, roughly power-law raw signal to a 0-100 score via a
// saturating curve: raw=scale -> ~63, raw=2*scale -> ~86, raw=3*scale -> ~95,
// approaching but never quite reaching 100. Keeps scores spread out and reserves
// the top of the range for real outliers instead of anyone above a linear cap.
function saturate(raw, scale) {
  return Math.round(100 * (1 - Math.exp(-Math.max(0, raw) / scale)));
}

// A founder we know little about is UNKNOWN, not bad — so the score regresses
// toward this neutral prior when few signals are observed, and only pulls away
// as evidence accumulates. This is the brief's cold-start requirement made
// concrete: a day-old launch with one upvote shouldn't read as "1/100".
const NEUTRAL_PRIOR = 50;
// Fraction of the full founder-score rubric that must be observed to fully trust
// the raw score (below this, we shrink toward the prior proportionally).
const COVERAGE_FOR_FULL_CONFIDENCE = 0.4;

// --- 3. Founder Score (persistent, Memory layer, cross-application) -------
// Cold-start safe: re-normalizes weights over whatever signals are actually
// available so a first-timer with no GitHub/funding/network still gets a real
// score instead of a zero. Callers pass RAW signal magnitudes (counts, lengths);
// this function owns the raw -> 0-100 mapping so the curve lives in one place.
export async function computeFounderScore({ githubHandle, applicationQualityRaw, domainCredibilityRaw, priorRecord }) {
  const weights = getScoringWeights().founder_score;
  const githubSignal = githubHandle ? await getGithubUserSignal(githubHandle) : null;

  const signals = {};
  if (githubSignal) {
    const accountAgeYears =
      (Date.now() - Date.parse(githubSignal.accountCreatedAt)) /
      (1000 * 60 * 60 * 24 * 365);
    // Compose the raw footprint, then map through a saturating curve. Star/
    // follower counts are power-law distributed, so a linear cap pins almost
    // everyone at 100; saturation spreads them across a believable band and
    // reserves the very top for genuine outliers.
    const rawTechnical =
      githubSignal.followers +
      githubSignal.totalStarsAcrossTopRepos * 0.5 +
      githubSignal.publicRepos * 8 +
      Math.min(accountAgeYears, 8) * 15;
    signals.technical_signal = saturate(rawTechnical, 600);
  }
  if (priorRecord?.trackRecordScore != null) signals.track_record = priorRecord.trackRecordScore;
  if (domainCredibilityRaw != null) signals.domain_credibility = saturate(domainCredibilityRaw, 150);
  if (applicationQualityRaw != null) signals.application_quality = saturate(applicationQualityRaw, 50);
  if (priorRecord?.pedigreeScore != null) signals.pedigree = priorRecord.pedigreeScore;
  // public_footprint left for a future pass (Area of Research #3) — omitted, not zeroed,
  // so it doesn't drag the re-normalized average down.

  const availableKeys = Object.keys(signals).filter((k) => signals[k] != null);
  const availableWeight = availableKeys.reduce((sum, k) => sum + (weights[k] || 0), 0);
  const totalRubricWeight = Object.values(weights).reduce((sum, w) => sum + w, 0) || 1;

  // Re-normalized weighted average over whatever signals we actually have.
  const rawScore = availableWeight
    ? availableKeys.reduce((sum, k) => sum + (signals[k] * (weights[k] || 0)) / availableWeight, 0)
    : NEUTRAL_PRIOR;

  // Confidence = how much of the rubric we observed. Shrink the score toward the
  // neutral prior by (1 - confidence), so thin evidence yields a near-neutral
  // score plus an explicit low confidence, rather than a falsely precise extreme.
  const confidence = Math.min(1, availableWeight / totalRubricWeight / COVERAGE_FOR_FULL_CONFIDENCE);
  const score = NEUTRAL_PRIOR + (rawScore - NEUTRAL_PRIOR) * confidence;

  return {
    score: Math.round(score),
    confidence: Math.round(confidence * 100),
    basedOn: availableKeys,
    coldStart: availableKeys.length <= (getScoringWeights().cold_start_min_signals || 1),
    githubSignal,
    updatedAt: new Date().toISOString(),
  };
}

// --- 4. 3-Axis Screening — Founder / Market / Idea-vs-Market --------------
// Deliberately NOT averaged into one number: each axis is returned independently
// with its own rating + trend, per the brief.
export async function scoreAxes({ thesis, extracted, founderScore, priorAxisScores }) {
  const system = `You are a VC associate scoring one opportunity along three INDEPENDENT axes for a
fund with this thesis:
${JSON.stringify(thesis)}

Score each axis separately — do NOT blend them into one number. Each axis gets a rating of
"bullish", "neutral", or "bear", a trend of "improving", "declining", or "stable" (compare against
the prior scores given, if any), a one-line rationale, and a 0-100 confidence.

Be honest about uncertainty: if the extracted data doesn't support a confident rating, say so in
the rationale rather than guessing. This is a cold-start-aware fund (risk_appetite: ${thesis.risk_appetite}) —
a first-time founder with no track record should be judged on application quality, problem
clarity, and founder-market fit as expressed in the deck, not penalized to zero for lacking a network.

Return strict JSON.`;

  const user = `Extracted company data:
${JSON.stringify(extracted)}

Persistent Founder Score for this founder: ${JSON.stringify(founderScore)}

Prior axis scores (if this founder/company applied before): ${JSON.stringify(priorAxisScores || null)}

Return JSON:
{
  "founder": { "rating": str, "trend": str, "rationale": str, "confidence": number },
  "market": { "rating": str, "trend": str, "rationale": str, "confidence": number },
  "idea_vs_market": { "rating": str, "trend": str, "rationale": str, "confidence": number }
}`;

  return completeJSON({ system, user });
}
