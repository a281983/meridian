// Shared brand mark — a meridian arc, echoing the credit-score gauge.
export default function Brand({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="brandGrad" x1="0" y1="0" x2="32" y2="32">
          <stop stopColor="#7c5cff" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="13" stroke="url(#brandGrad)" strokeWidth="2.5" opacity="0.35" />
      <path d="M4 20 A12 12 0 0 1 28 20" stroke="url(#brandGrad)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="16" cy="16" r="3" fill="url(#brandGrad)" />
    </svg>
  );
}
