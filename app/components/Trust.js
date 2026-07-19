// Per-claim Trust Score. Each extracted claim gets its own confidence chip and
// evidence line — the brief's "trace every claim to evidence" made visible.
const CHIP = {
  verified: { label: "Verified", bg: "rgba(52,211,153,0.15)", color: "var(--pos)" },
  plausible: { label: "Plausible", bg: "rgba(251,191,36,0.15)", color: "var(--neu)" },
  unverifiable: { label: "Unverifiable", bg: "rgba(255,255,255,0.06)", color: "var(--faint)" },
  contradicted: { label: "Contradicted", bg: "rgba(251,113,133,0.16)", color: "var(--neg)" },
};

export default function TrustList({ claims }) {
  if (!claims?.length) {
    return <p className="text-sm text-[var(--faint)]">No claims extracted yet.</p>;
  }
  return (
    <ul className="space-y-3">
      {claims.map((c) => {
        const chip = CHIP[c.confidence] || CHIP.unverifiable;
        return (
          <li key={c.id} className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
            <span
              className="shrink-0 self-start text-[11px] font-semibold uppercase tracking-wide rounded-md px-2 py-1"
              style={{ background: chip.bg, color: chip.color }}
            >
              {chip.label}
            </span>
            <div className="min-w-0">
              <p className="text-sm text-[var(--text)]">{c.text}</p>
              <p className="text-xs text-[var(--faint)] mt-0.5">{c.evidence}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
