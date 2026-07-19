// Turns the 3 screening axes into glanceable, jargon-free indicators.
// "bullish/neutral/bear" -> arrow direction + colour + a plain word.
const RATING = {
  bullish: { word: "Positive", color: "var(--pos)", rot: 0 },
  neutral: { word: "Neutral", color: "var(--neu)", rot: 90 },
  bear: { word: "Caution", color: "var(--neg)", rot: 180 },
};
const TREND = {
  improving: { glyph: "↗", word: "improving", color: "var(--pos)" },
  stable: { glyph: "→", word: "stable", color: "var(--faint)" },
  declining: { glyph: "↘", word: "declining", color: "var(--neg)" },
};

const AXIS_LABEL = {
  founder: "Founder",
  market: "Market",
  idea_vs_market: "Idea vs Market",
};

function Arrow({ rot, color, size = 20 }) {
  // Base arrow points up; rotate for right (neutral) / down (caution).
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ transform: `rotate(${rot}deg)` }}>
      <path
        d="M12 4 L12 20 M12 4 L6 10 M12 4 L18 10"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

// Compact: a single pill for use inside dashboard cards.
export function AxisMini({ axis, rating }) {
  const r = RATING[rating] || RATING.neutral;
  return (
    <div className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 bg-[var(--surface)] border border-[var(--border)]">
      <Arrow rot={r.rot} color={r.color} size={14} />
      <span className="text-[11px] text-[var(--muted)] leading-none">{AXIS_LABEL[axis]}</span>
    </div>
  );
}

// Full tile: for the opportunity detail page.
export function AxisTile({ axis, data }) {
  const r = RATING[data?.rating] || RATING.neutral;
  const t = TREND[data?.trend] || TREND.stable;
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-[var(--faint)]">{AXIS_LABEL[axis]}</span>
        <span className="text-xs" style={{ color: t.color }}>
          {t.glyph} {t.word}
        </span>
      </div>
      <div className="flex items-center gap-3 mt-3">
        <span
          className="h-11 w-11 rounded-full grid place-items-center shrink-0"
          style={{ background: `color-mix(in srgb, ${r.color} 16%, transparent)` }}
        >
          <Arrow rot={r.rot} color={r.color} size={22} />
        </span>
        <div>
          <div className="font-semibold text-lg leading-none" style={{ color: r.color }}>
            {r.word}
          </div>
          {data?.confidence != null && (
            <div className="text-xs text-[var(--faint)] mt-1">{data.confidence}% confidence</div>
          )}
        </div>
      </div>
      {data?.rationale && (
        <p className="text-sm text-[var(--muted)] mt-3 leading-relaxed">{data.rationale}</p>
      )}
    </div>
  );
}
