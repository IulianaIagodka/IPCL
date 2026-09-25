"use client";

import Link from "next/link";
import { useAsyncResource, api } from "@/lib/client";
import { MemoryCard } from "@/components/MemoryCard";
import { ContextFlow } from "@/components/ContextFlow";
import { StateBadge } from "@/components/StateBadge";
import type { Integration } from "@/lib/types";

type Stats = {
  projects: number;
  preferences: number;
  decisions: number;
  sources: number;
  contextItems: number;
  hasProfile: boolean;
  recentMemories: Array<{
    id: string;
    kind: string;
    title: string;
    content: string;
    projectName: string | null;
    updatedAt: string;
    sourceId: string | null;
  }>;
};

export default function VaultPage() {
  const { data, error, loading, reload } = useAsyncResource(
    () => api<Stats>("/api/vault"),
    []
  );
  const integrations = useAsyncResource(
    () => api<Integration[]>("/api/integrations"),
    []
  );

  const active =
    integrations.data?.filter((i) => !i.revokedAt) ?? [];
  const connected = active.length;

  return (
    <div className="shell section stack">
      <div className="fade-up">
        <p className="eyebrow">Eidothea</p>
        <h2 className="page-title">One memory. Every AI.</h2>
        <p className="muted" style={{ maxWidth: "38rem", lineHeight: 1.55 }}>
          Orientation and trust — not analytics. See memories, active
          integrations, and anything that needs attention.
        </p>
      </div>

      {loading && <p className="muted">Loading vault…</p>}
      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}

      {data && (
        <>
          <div className="stat-strip fade-up-delay">
            <div className="stat-cell">
              <span>Memories</span>
              <strong>{data.contextItems}</strong>
            </div>
            <div className="stat-cell">
              <span>Projects</span>
              <strong>{data.projects}</strong>
            </div>
            <div className="stat-cell">
              <span>Integrations</span>
              <strong>{connected}</strong>
            </div>
          </div>

          <div className="grid-2 fade-up-delay">
            <div className="stack">
              <div className="panel stack">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "1rem",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <p className="eyebrow">Recently learned</p>
                    <h3 style={{ margin: 0, fontSize: "1.15rem" }}>
                      Latest memories
                    </h3>
                  </div>
                  <Link href="/vault/context" className="btn btn-ghost btn-sm">
                    Browse context
                  </Link>
                </div>
                {data.recentMemories.length === 0 && (
                  <p className="muted" style={{ margin: 0 }}>
                    No memories yet. Import a conversation or add a project
                    decision.
                  </p>
                )}
                <div className="stack" style={{ gap: "0.65rem" }}>
                  {data.recentMemories.slice(0, 5).map((memory) => (
                    <MemoryCard
                      key={memory.id}
                      memory={{
                        ...memory,
                        sourceLabel: memory.sourceId
                          ? "Imported source"
                          : "Manual entry",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="stack">
              <div className="panel stack">
                <p className="eyebrow">Live transfer</p>
                <ContextFlow
                  from="Vault"
                  to={active[0]?.name || "AI client"}
                  label={
                    connected
                      ? `${connected} integration${connected === 1 ? "" : "s"} connected`
                      : "Connect an integration to share context"
                  }
                />
                <div className="stack" style={{ gap: "0.45rem" }}>
                  {active.map((item) => (
                    <div
                      key={item.id}
                      className="list-row"
                      style={{ padding: "0.55rem 0" }}
                    >
                      <span>
                        {item.name}{" "}
                        <span className="muted">({item.accessMode})</span>
                      </span>
                      <StateBadge state="connected" />
                    </div>
                  ))}
                </div>
                <Link href="/vault/security" className="btn btn-ghost">
                  Manage access
                </Link>
              </div>

              <div className="panel stack">
                <p className="eyebrow">Needs attention</p>
                <div className="list-row" style={{ padding: "0.55rem 0" }}>
                  <span>Profile</span>
                  <StateBadge
                    state={data.hasProfile ? "active" : "restricted"}
                    label={data.hasProfile ? "READY" : "INCOMPLETE"}
                  />
                </div>
                <div className="list-row" style={{ padding: "0.55rem 0" }}>
                  <span>Share preview</span>
                  <Link href="/vault/preview" className="btn btn-ghost btn-sm">
                    Open
                  </Link>
                </div>
                <div className="list-row" style={{ padding: "0.55rem 0" }}>
                  <span>Security</span>
                  <Link href="/vault/security" className="btn btn-ghost btn-sm">
                    Open
                  </Link>
                </div>
                <button className="btn btn-ghost" onClick={() => void reload()}>
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
