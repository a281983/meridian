// Credit-score-style semicircle gauge. No naked numbers: shows the value out of
// 100, a plain-English band, and (optionally) confidence — so "72" reads as
// "Strong, 72/100, 85% confidence" at a glance, on a phone.
function band(score) {
  if (score >= 80) return { label: "Exceptional", color: "var(--pos)" };
  if (score >= 65) return { label: "Strong", color: "var(--pos)" };
  if (score >= 50) return { label: "Emerging", color: "var(--neu)" };
  if (score >= 35) return { label: "Developing", color: "var(--neu)" };
  return { label: "Unproven", color: "var(--neg)" };
}

export default function ScoreGauge({ score = 0, confidence, size = 220, big = true }) {
  const cx = 100, cy = 100, r = 86, sw = 13;
  const f = Math.max(0, Math.min(100, score)) / 100;
  const theta = (180 - 180 * f) * (Math.PI / 180);
  const px = cx + r * Math.cos(theta);
  const py = cy - r * Math.sin(theta);
  const b = band(score);

  return (
    <div className="relative inline-block" style={{ width: size, height: size * 0.66 }}>
      <svg viewBox="0 0 200 112" width={size} height={size * 0.56} className="block">
        <defs>
          <linearGradient id="gaugeGrad" x1="14" y1="0" x2="186" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#fb7185" />
            <stop offset="0.5" stopColor="#fbbf24" />
            <stop offset="1" stopColor="#34d399" />
          </linearGradient>
        </defs>
        {/* track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={sw}
          strokeLinecap="round"
        />
        {/* progress */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${px} ${py}`}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth={sw}
          strokeLinecap="round"
        />
        {/* tip marker */}
        <circle cx={px} cy={py} r={sw / 2 + 2} fill="#fff" />
      </svg>

      {/* Readout sits in the bowl below the arc crown — anchored from the top with
          clearance so tall digits never cross the arc on the sides. */}
      <div className="absolute inset-x-0 flex flex-col items-center" style={{ top: size * 0.29 }}>
        <div className="flex items-baseline gap-0.5">
          <span
            className="font-semibold leading-none"
            style={{ fontFamily: "var(--font-display)", fontSize: big ? size * 0.21 : size * 0.17 }}
          >
            {Math.round(score)}
          </span>
          <span className="text-[var(--faint)] font-medium" style={{ fontSize: size * 0.07 }}>
            /100
          </span>
        </div>
        <span
          className="font-semibold uppercase tracking-wide mt-1"
          style={{ color: b.color, fontSize: size * 0.058 }}
        >
          {b.label}
        </span>
        {confidence != null && (
          <span className="text-[var(--faint)] mt-0.5" style={{ fontSize: size * 0.046 }}>
            {confidence}% confidence
          </span>
        )}
      </div>
    </div>
  );
}
