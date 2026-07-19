import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { listRecords } from "@/lib/store";
import ScoreGauge from "../components/ScoreGauge";
import OpportunityCard from "../components/OpportunityCard";

export const dynamic = "force-dynamic";

export default async function FounderHome() {
  const session = await getSession();
  if (!session) redirect("/");
  if (session.role !== "founder") redirect("/dashboard");

  const mine = (await listRecords("opportunities"))
    .filter((o) => o.ownerEmail === session.email)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  const latest = mine[0];
  const first = session.name.split(" ")[0];

  return (
    <main className="mx-auto max-w-3xl px-5 py-8 sm:py-10">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
        Welcome, {first}
      </h1>

      {latest ? (
        <>
          <div className="glass rounded-2xl p-6 sm:p-8 mt-5 flex flex-col sm:flex-row items-center gap-6">
            <ScoreGauge
              score={latest.founderScoreSnapshot?.score ?? 0}
              confidence={latest.founderScoreSnapshot?.confidence}
              size={200}
            />
            <div className="text-center sm:text-left">
              <div className="text-xs uppercase tracking-wide text-[var(--faint)]">Your Founder Score</div>
              <p className="text-sm text-[var(--muted)] mt-2 leading-relaxed max-w-sm">
                This score is <span className="text-[var(--text)]">persistent</span> — it follows you across
                every application and sharpens as you ship. Ship more, it climbs.
              </p>
              <a
                href="/apply"
                className="btn-ghost inline-block mt-4 px-4 py-2 text-sm"
              >
                Apply with a new idea
              </a>
            </div>
          </div>

          <h2 className="text-sm uppercase tracking-wide text-[var(--faint)] mt-8 mb-3">
            Your applications
          </h2>
          <div className="space-y-4">
            {mine.map((o) => (
              <OpportunityCard key={o.id} opp={o} />
            ))}
          </div>
        </>
      ) : (
        <div className="glass rounded-2xl p-8 sm:p-10 mt-6 text-center">
          <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            You haven't applied yet
          </h2>
          <p className="text-sm text-[var(--muted)] mt-2 max-w-md mx-auto">
            Submit a deck and your company name. Within minutes you'll get a transparent Founder
            Score and a 3-axis read — no warm intro required.
          </p>
          <a href="/apply" className="btn-primary inline-block mt-6 px-6 py-3 text-sm">
            Apply for funding
          </a>
        </div>
      )}
    </main>
  );
}
