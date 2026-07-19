import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { listRecords } from "@/lib/store";
import { getThesis } from "@/lib/config";
import OpportunityCard from "../components/OpportunityCard";

function bullishCount(a) {
  if (!a) return 0;
  return ["founder", "market", "idea_vs_market"].filter((k) => a[k]?.rating === "bullish").length;
}

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const session = await getSession();
  if (!session) redirect("/");
  if (session.role !== "investor") redirect("/founder");

  const thesis = getThesis();
  const opportunities = (await listRecords("opportunities")).sort((a, b) => {
    const d = bullishCount(b.axisScores) - bullishCount(a.axisScores);
    if (d !== 0) return d;
    return (b.founderScoreSnapshot?.score || 0) - (a.founderScoreSnapshot?.score || 0);
  });

  return (
    <main className="mx-auto max-w-3xl px-5 py-8 sm:py-10">
      <div className="mb-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
          Pipeline
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          {thesis.sectors.join(" · ")} · {thesis.stage.join("/")} · $
          {thesis.check_size.target_usd.toLocaleString()} checks
        </p>
      </div>

      {/* Footnote — how to read the dashboard */}
      <div className="glass rounded-xl px-4 py-3 mt-4 mb-6 text-xs text-[var(--muted)] leading-relaxed">
        <span className="text-[var(--text)] font-medium">How to read this: </span>
        the gauge is each founder's persistent <span className="text-[var(--text)]">Founder Score</span> /100
        (with confidence — low confidence means we need more data, not that they're weak). The three chips are
        independent axes — <span className="text-[var(--pos)]">↑ Positive</span>,
        {" "}<span className="text-[var(--neu)]">→ Neutral</span>,
        {" "}<span className="text-[var(--neg)]">↓ Caution</span> — never averaged. Ranked by conviction.
      </div>

      {opportunities.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <p className="text-[var(--muted)]">No applications yet.</p>
          <p className="text-xs text-[var(--faint)] mt-1">Founders who apply appear here automatically.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {opportunities.map((o) => (
            <OpportunityCard key={o.id} opp={o} />
          ))}
        </div>
      )}
    </main>
  );
}
