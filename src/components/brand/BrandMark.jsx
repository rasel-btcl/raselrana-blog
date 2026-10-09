// Shared with the main site (docs/design-brief.md) — keep identical.
export default function BrandMark({ className = "", size = 30 }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Rasel Rana"
    >
      <rect width="32" height="32" rx="8" fill="var(--ink)" />
      <g
        fill="none"
        stroke="var(--paper)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M11 24V8h6.25a4.5 4.5 0 0 1 0 9H11" />
        <path d="M16 17l3.9 5" />
      </g>
      <circle cx="21.6" cy="24" r="2.3" fill="var(--paper)" />
    </svg>
  );
}
