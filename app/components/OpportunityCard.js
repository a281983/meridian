import ScoreGauge from "./ScoreGauge";
import { AxisMini } from "./Axis";

export default function OpportunityCard({ opp }) {
  const fs = opp.founderScoreSnapshot;
  return (
    <a
      href={`/opportunity/${opp.id}`}
      className="glass glass-hover rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-5"
    >
      <div className="shrink-0">
        <ScoreGauge score={fs?.score ?? 0} confidence={fs?.confidence} size={128} big={false} />
      </div>

      <div className="flex-1 w-full text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <h3 className="font-semibold text-lg tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            {opp.companyName}
          </h3>
        </div>
        <p className="text-xs text-[var(--faint)] mt-0.5 capitalize">
          {opp.status} · applied
        </p>

        <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
          {["founder", "market", "idea_vs_market"].map((axis) => (
            <AxisMini key={axis} axis={axis} rating={opp.axisScores?.[axis]?.rating} />
          ))}
        </div>
      </div>

      <span className="text-[var(--muted)] hidden sm:block shrink-0">→</span>
    </a>
  );
}
