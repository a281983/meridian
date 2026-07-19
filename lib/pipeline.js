// Shared funnel logic — inbound (/api/apply) and outbound (/api/source) both
// call into here so both tracks are scored identically and land in the same
// `opportunities` collection, per the brief's "Converge" requirement.
import { upsertRecord, findRecord } from "./store";
import { extractClaims, verifyClaims, computeFounderScore, scoreAxes } from "./scoring";
import { getThesis } from "./config";

function founderKey({ githubHandle, email, name }) {
  return (githubHandle || email || name || "unknown").toLowerCase().trim();
}

async function upsertFounder({ name, email, githubHandle, linkedinUrl, applicationQualityRaw, domainCredibilityRaw }) {
  const id = founderKey({ githubHandle, email, name });
  const prior = await findRecord("founders", (f) => f.id === id);

  const founderScore = await computeFounderScore({
    githubHandle,
    applicationQualityRaw,
    domainCredibilityRaw,
    priorRecord: prior,
  });

  const record = {
    id,
    name: name || prior?.name || null,
    email: email || prior?.email || null,
    githubHandle: githubHandle || prior?.githubHandle || null,
    linkedinUrl: linkedinUrl || prior?.linkedinUrl || null,
    founderScore,
    trackRecordScore: prior?.trackRecordScore ?? null,
    pedigreeScore: prior?.pedigreeScore ?? null,
    applications: prior?.applications || [],
  };

  return await upsertRecord("founders", record);
}

// Inbound: full pipeline — deck required, so we get real extraction + per-claim
// trust scoring against the web.
export async function processInboundApplication({ companyName, deckText, extra, founder, ownerEmail }) {
  const thesis = getThesis();
  const extracted = await extractClaims({ companyName, deckText, extra });
  const trustScores = await verifyClaims({ claims: extracted.claims || [], companyName });

  // Raw magnitude — computeFounderScore saturates it. Longer, claim-richer decks
  // read as higher-effort applications.
  const applicationQualityRaw =
    (deckText?.length || 0) / 100 + (extracted.claims?.length || 0) * 5;

  const founderRecord = await upsertFounder({
    ...founder,
    applicationQualityRaw,
  });

  const priorOpportunity = await findRecord(
    "opportunities",
    (o) => o.companyName === companyName && o.founderId === founderRecord.id
  );

  const axisScores = await scoreAxes({
    thesis,
    extracted,
    founderScore: founderRecord.founderScore,
    priorAxisScores: priorOpportunity?.axisScores,
  });

  const id = priorOpportunity?.id || globalThis.crypto.randomUUID();
  const opportunity = {
    id,
    source: "inbound",
    channel: null,
    companyName,
    founderId: founderRecord.id,
    ownerEmail: ownerEmail || founder?.email || null,
    status: "screened",
    extracted,
    trustScores,
    axisScores,
    founderScoreSnapshot: founderRecord.founderScore,
    memo: null,
    sourceUrl: null,
    createdAt: priorOpportunity?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await upsertRecord("opportunities", opportunity);

  if (!founderRecord.applications.includes(id)) {
    founderRecord.applications.push(id);
    await upsertRecord("founders", founderRecord);
  }

  return opportunity;
}

// Outbound: no deck yet, so extraction is a lighter pass over the public
// signal we scraped (repo description, HN post text, etc). Still scored on
// the same 3 axes and lands in the same collection as inbound.
export async function processOutboundLead(lead) {
  const thesis = getThesis();
  const dedup = await findRecord("opportunities", (o) => o.sourceUrl === lead.sourceUrl);
  if (dedup) return dedup;

  const extracted = {
    snapshot: {
      market: null,
      problem: null,
      urgency: null,
      solution: lead.signal?.description || lead.company || null,
    },
    team: null,
    market_sizing: null,
    competition: [],
    traction: null,
    financials_mentioned: false,
    cap_table_mentioned: false,
    claims: [
      {
        id: "outbound-signal",
        category: "other",
        text: `${lead.source} signal: ${JSON.stringify(lead.signal)}`,
      },
    ],
  };

  const trustScores = await verifyClaims({ claims: extracted.claims, companyName: lead.company });

  // Cold-start floor: every outbound lead carries *some* public signal (that's
  // what sourcing found them by) — always turn it into at least one Founder Score
  // input so it never silently resolves to a flat 0, per the cold-start policy
  // in config/scoring-weights.yaml. Pass the raw count; computeFounderScore
  // saturates it (GitHub stars and HN points are similar-order approval counts).
  const domainCredibilityRaw = lead.signal?.stars ?? lead.signal?.points ?? null;

  const founderRecord = await upsertFounder({
    name: lead.founderHandle,
    githubHandle: lead.source === "github" ? lead.founderHandle : null,
    domainCredibilityRaw,
  });

  const axisScores = await scoreAxes({
    thesis,
    extracted,
    founderScore: founderRecord.founderScore,
    priorAxisScores: null,
  });

  const id = globalThis.crypto.randomUUID();
  const opportunity = {
    id,
    source: "outbound",
    channel: lead.source,
    companyName: lead.company,
    founderId: founderRecord.id,
    status: "sourced",
    extracted,
    trustScores,
    axisScores,
    founderScoreSnapshot: founderRecord.founderScore,
    memo: null,
    sourceUrl: lead.sourceUrl,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await upsertRecord("opportunities", opportunity);

  if (!founderRecord.applications.includes(id)) {
    founderRecord.applications.push(id);
    await upsertRecord("founders", founderRecord);
  }

  return opportunity;
}
