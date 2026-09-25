export function ContextFlow({
  from = "Vault",
  to = "AI",
  label,
  compact = false,
}: {
  from?: string;
  to?: string;
  label?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`context-flow${compact ? " is-compact" : ""}`}
      aria-label={label || `Context flowing from ${from} to ${to}`}
    >
      <span className="context-flow-node">{from}</span>
      <span className="context-flow-track" aria-hidden="true">
        <span className="context-flow-pulse" />
      </span>
      <span className="context-flow-node is-accent">{to}</span>
      {label ? <span className="context-flow-label">{label}</span> : null}
    </div>
  );
}

export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className="brand-mark-svg"
    >
      <path
        d="M4 16h8.5M19.5 16H28"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="brand-path"
      />
      <circle cx="4" cy="16" r="2.2" fill="currentColor" opacity="0.9" />
      <circle
        cx="16"
        cy="16"
        r="3"
        stroke="var(--accent)"
        strokeWidth="1.5"
        fill="var(--accent-muted)"
      />
      <circle cx="28" cy="16" r="2.2" fill="var(--accent)" />
    </svg>
  );
}
