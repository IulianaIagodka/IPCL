"use client";

import { api, useAsyncResource } from "@/lib/client";
import { StateBadge } from "@/components/StateBadge";

type ActivityPayload = {
  events: Array<{
    id: string;
    kind: string;
    summary: string;
    detail: string;
    createdAt: string;
  }>;
};

function formatTime(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function kindState(kind: string) {
  if (kind === "share" || kind === "access" || kind === "connect") {
    return "shared" as const;
  }
  if (kind === "restrict" || kind === "disconnect") {
    return "restricted" as const;
  }
  return "active" as const;
}

export default function ActivityPage() {
  const { data, error, loading, reload } = useAsyncResource(
    () => api<ActivityPayload>("/api/activity"),
    []
  );

  return (
    <div className="shell section stack">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "1rem",
          alignItems: "flex-end",
          flexWrap: "wrap",
        }}
      >
        <div>
          <p className="eyebrow">Activity</p>
          <h2 className="page-title">Context access log</h2>
          <p className="muted" style={{ maxWidth: "38rem", lineHeight: 1.55 }}>
            When an AI requests or receives context, it shows up here — not
            behind abstract status messages.
          </p>
        </div>
        <button className="btn btn-ghost" onClick={() => void reload()}>
          Refresh
        </button>
      </div>

      <div className="panel">
        {loading && <p className="muted">Loading activity…</p>}
        {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
        {!loading && data?.events.length === 0 && (
          <p className="muted" style={{ margin: 0 }}>
            No activity yet. Connect an integration or build a share preview.
          </p>
        )}
        {data?.events.map((event) => (
          <article key={event.id} className="activity-item">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "1rem",
                flexWrap: "wrap",
              }}
            >
              <strong>{event.summary}</strong>
              <StateBadge state={kindState(event.kind)} label={event.kind} />
            </div>
            {event.detail && (
              <p className="muted" style={{ margin: 0, lineHeight: 1.45 }}>
                {event.detail}
              </p>
            )}
            <span className="meta-quiet">{formatTime(event.createdAt)}</span>
          </article>
        ))}
      </div>
    </div>
  );
}
