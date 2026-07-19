import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { getRecord, upsertRecord } from "@/lib/store";
import { generateMemo } from "@/lib/memo";
import ScoreGauge from "../../components/ScoreGauge";
import { AxisTile } from "../../components/Axis";
import TrustList from "../../components/Trust";

export const dynamic = "force-dynamic";

// Memo is generated lazily on first view. Both the generation (needs
// OPENAI_API_KEY) and the caching write (needs a writable store — Blob in prod)
// can fail, and neither should take down the page: the scores, axes, and trust
// evidence are already stored and worth showing on their own. Degrade instead of
// crashing.
async function withMemo(opp) {
  if (opp.memo) return opp;
  try {
    const memo = await generateMemo({
      companyName: opp.companyName,
      extracted: opp.extracted,
      trustScores: opp.trustScores,
      axisScores: opp.axisScores,
      founderScore: opp.founderScoreSnapshot,
    });
    try {
      await upsertRecord("opportunities", { ...opp, memo });
    } catch {
      // Read-only FS with no Blob store — serve the fresh memo without caching it.
    }
    return { ...opp, memo };
  } catch {
    return opp; // Memo unavailable (e.g. no API key) — render everything else.
  }
}

export default async function OpportunityPage({ params }) {
  const session = await getSession();
  if (!session) redirect("/");

  const { id } = await params;
  let opportunity = await getRecord("opportunities", id);
  if (!opportunity) notFound();

  // Founders can only see their own; investors see all.
  if (session.role === "founder" && opportunity.ownerEmail !== session.email) {
    redirect("/founder");
  }

  opportunity = await withMemo(opportunity);
  const { axisScores, founderScoreSnapshot, trustScores, memo } = opportunity;

  return (
    <main className="mx-auto max-w-3xl px-5 py-8 sm:py-10 space-y-8">
      <div>
        <a
          href={session.role === "investor" ? "/dashboard" : "/founder"}
          className="text-sm text-[var(--muted)] hover:text-[var(--text)] transition"
        >
          ← Back
        </a>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-2" style={{ fontFamily: "var(--font-display)" }}>
          {opportunity.companyName}
        </h1>
        <p className="text-sm text-[var(--faint)] capitalize">{opportunity.status} · applied</p>
      </div>

      {/* Founder Score */}
      <section className="glass rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
        <ScoreGauge
          score={founderScoreSnapshot?.score ?? 0}
          confidence={founderScoreSnapshot?.confidence}
          size={200}
        />
        <div className="text-center sm:text-left">
          <div className="text-xs uppercase tracking-wide text-[var(--faint)]">
            Founder Score — persistent, cross-application
          </div>
          <p className="text-sm text-[var(--muted)] mt-2 max-w-sm leading-relaxed">
            Based on {founderScoreSnapshot?.basedOn?.join(", ") || "available signals"}.
            {founderScoreSnapshot?.coldStart &&
              " Cold-start founder — regressed toward a neutral 50 until more signal arrives, so a thin record reads as unknown, not weak."}
          </p>
        </div>
      </section>

      {/* 3 axes */}
      <section>
        <h2 className="text-sm uppercase tracking-wide text-[var(--faint)] mb-3">
          Three-axis screening <span className="normal-case text-[var(--faint)]">· scored independently, never averaged</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {["founder", "market", "idea_vs_market"].map((axis) => (
            <AxisTile key={axis} axis={axis} data={axisScores?.[axis]} />
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="glass rounded-2xl p-6">
        <h2 className="font-semibold mb-1" style={{ fontFamily: "var(--font-display)" }}>
          Trust Score
        </h2>
        <p className="text-xs text-[var(--faint)] mb-4">Per claim — each traced to evidence, not a single company number.</p>
        <TrustList claims={trustScores} />
      </section>

      {/* Memo */}
      <section className="glass rounded-2xl p-6">
        <h2 className="font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>
          Investment Memo
        </h2>
        {memo ? (
          <div className="space-y-5">
            {memo.sections.map((s) => (
              <div key={s.id}>
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  {s.title}
                  {s.required && (
                    <span className="text-[10px] uppercase tracking-wide text-[var(--faint)] border border-[var(--border)] rounded px-1.5 py-0.5">
                      required
                    </span>
                  )}
                </h3>
                {s.content ? (
                  <p className="text-sm text-[var(--muted)] whitespace-pre-wrap mt-1.5 leading-relaxed">{s.content}</p>
                ) : (
                  <p className="text-sm text-[var(--faint)] italic mt-1.5">
                    Not disclosed / unavailable at this stage{s.flagged_missing ? `: ${s.flagged_missing}` : ""}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--faint)]">
            Memo not generated yet. Scores and evidence above are live; the full memo drafts on
            first view once an OpenAI key is configured.
          </p>
        )}
      </section>
    </main>
  );
}
