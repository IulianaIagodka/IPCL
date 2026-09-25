"use client";

import { api, useAsyncResource } from "@/lib/client";
import type { AuditEvent } from "@/lib/types";

export default function ActivityPage() {
  const audit = useAsyncResource(
    () => api<AuditEvent[]>("/api/audit?limit=50"),
    []
  );

  return (
    <div className="shell section stack">
      <div className="fade-up">
        <p className="pill">Activity</p>
        <h2>What was accessed or shared</h2>
        <p className="muted" style={{ maxWidth: "40rem", lineHeight: 1.55 }}>
          Audit visibility for the control plane. Every search, preview, export,
          and MCP retrieval that crosses the Context Service is recorded here.
        </p>
        <button className="btn btn-ghost" onClick={() => void audit.reload()}>
          Refresh
        </button>
      </div>

      <div className="panel stack fade-up-delay">
        {audit.loading && <p className="muted">Loading activity…</p>}
        {audit.error && <p style={{ color: "#8a2f2f" }}>{audit.error}</p>}
        {audit.data?.length === 0 && (
          <p className="muted">No activity yet. Connect an AI or run a search.</p>
        )}
        {audit.data?.map((event) => (
          <div key={event.id} className="list-row" style={{ alignItems: "flex-start" }}>
            <div>
              <strong>{event.action}</strong>
              <div className="muted" style={{ fontSize: "0.85rem" }}>
                {event.createdAt}
                {event.scope ? ` · ${event.scope}` : ""}
                {event.destination ? ` · → ${event.destination}` : ""}
                {event.includedSensitive ? " · sensitive" : ""}
                {event.memoryCount ? ` · ${event.memoryCount} memories` : ""}
              </div>
            </div>
            <span className="muted">{event.actorType}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
