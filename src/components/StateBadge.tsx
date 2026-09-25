"use client";

type MemoryState =
  | "active"
  | "restricted"
  | "superseded"
  | "connected"
  | "disconnected"
  | "shared"
  | "not-shared";

const LABELS: Record<MemoryState, string> = {
  active: "ACTIVE",
  restricted: "RESTRICTED",
  superseded: "SUPERSEDED",
  connected: "CONNECTED",
  disconnected: "DISCONNECTED",
  shared: "SHARED",
  "not-shared": "NOT SHARED",
};

export function StateBadge({
  state,
  label,
}: {
  state: MemoryState;
  label?: string;
}) {
  return (
    <span className={`state-badge state-${state}`} data-state={state}>
      <span className="state-dot" aria-hidden="true" />
      {label ?? LABELS[state]}
    </span>
  );
}
