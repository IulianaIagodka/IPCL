"use client";

import { useState } from "react";
import { StateBadge } from "./StateBadge";

export type MemoryView = {
  id: string;
  kind: string;
  title: string;
  content: string;
  projectName?: string | null;
  sourceLabel?: string | null;
  updatedAt: string;
  tags?: string[];
};

function formatTime(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function MemoryCard({
  memory,
  usedBy = [],
  restricted = false,
}: {
  memory: MemoryView;
  usedBy?: string[];
  restricted?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <article className={`memory-card${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="memory-card-main"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="memory-card-top">
          <span className="meta-label">{memory.kind}</span>
          <span className="meta-quiet">{formatTime(memory.updatedAt)}</span>
        </div>
        <p className="memory-card-body">
          {memory.title && memory.title !== memory.kind
            ? memory.title
            : memory.content}
        </p>
        {memory.title && memory.title !== memory.kind && (
          <p className="memory-card-sub">{memory.content}</p>
        )}
        <div className="memory-card-meta">
          <span>{memory.projectName || "Global"}</span>
          <span>Source: {memory.sourceLabel || "—"}</span>
          {restricted ? (
            <StateBadge state="restricted" />
          ) : (
            <StateBadge state="active" />
          )}
        </div>
      </button>
      {open && (
        <div className="memory-card-expand">
          <div>
            <span className="meta-label">Used by</span>
            <p className="muted" style={{ margin: "0.35rem 0 0" }}>
              {usedBy.length ? usedBy.join(", ") : "Not shared yet"}
            </p>
          </div>
          <div>
            <span className="meta-label">Last accessed</span>
            <p className="muted" style={{ margin: "0.35rem 0 0" }}>
              {formatTime(memory.updatedAt)}
            </p>
          </div>
          <div className="memory-card-actions">
            <button type="button" className="btn btn-ghost btn-sm" disabled>
              Edit
            </button>
            <button type="button" className="btn btn-ghost btn-sm" disabled>
              Archive
            </button>
            <button type="button" className="btn btn-ghost btn-sm" disabled>
              Restrict
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
