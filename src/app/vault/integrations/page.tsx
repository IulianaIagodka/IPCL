"use client";

import Link from "next/link";
import { api, useAsyncResource } from "@/lib/client";
import { StateBadge } from "@/components/StateBadge";
import { ContextFlow } from "@/components/ContextFlow";
import type { Integration } from "@/lib/types";

export default function IntegrationsPage() {
  const { data, error, loading, reload } = useAsyncResource(
    () => api<Integration[]>("/api/integrations"),
    []
  );

  async function revoke(id: string) {
    await api("/api/integrations", {
      method: "POST",
      body: JSON.stringify({ action: "revoke", id }),
    });
    await reload();
  }

  const active = data?.filter((i) => !i.revokedAt) ?? [];

  return (
    <div className="shell section stack">
      <div>
        <p className="eyebrow">Integrations</p>
        <h2 className="page-title">Who can see what?</h2>
        <p className="muted" style={{ maxWidth: "40rem", lineHeight: 1.55 }}>
          ADR-003 default-deny model. Connect AI clients with explicit scopes
          under Security. Integrations are read-only unless you grant write.
        </p>
      </div>

      <div className="panel stack">
        <ContextFlow
          from="Vault"
          to={active[0]?.name || "AI client"}
          label={
            active.length
              ? `${active.length} active integration${active.length === 1 ? "" : "s"}`
              : "No integrations connected"
          }
        />
        <Link href="/vault/security" className="btn btn-primary">
          Open Security to connect
        </Link>
      </div>

      {loading && <p className="muted">Loading integrations…</p>}
      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}

      <div className="panel stack">
        <p className="eyebrow">Connected</p>
        {active.length === 0 && (
          <p className="muted" style={{ margin: 0 }}>
            None yet.
          </p>
        )}
        {active.map((item) => (
          <div key={item.id} className="list-row" style={{ alignItems: "flex-start" }}>
            <div>
              <strong>
                {item.name}{" "}
                <span className="muted">({item.provider})</span>
              </strong>
              <div className="muted" style={{ fontSize: "0.9rem" }}>
                {item.accessMode} · scopes: {item.scopes.join(", ")}
              </div>
              <div className="muted" style={{ fontSize: "0.85rem" }}>
                classes: {item.allowedClassifications.join(", ")}
                {item.allowedProjectIds
                  ? ` · ${item.allowedProjectIds.length} project(s)`
                  : " · all projects"}
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <StateBadge state="connected" />
              <button className="btn btn-ghost btn-sm" onClick={() => void revoke(item.id)}>
                Revoke
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
