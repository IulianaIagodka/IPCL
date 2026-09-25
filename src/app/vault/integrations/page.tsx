"use client";

import Link from "next/link";
import { api, useAsyncResource } from "@/lib/client";
import { StateBadge } from "@/components/StateBadge";
import { ContextFlow } from "@/components/ContextFlow";

type MatrixPayload = {
  integrations: Array<{
    id: string;
    name: string;
    status: "connected" | "disconnected";
  }>;
  matrix: {
    integrations: Array<{
      id: string;
      name: string;
      status: "connected" | "disconnected";
    }>;
    scopes: string[];
    cells: Array<{
      integrationId: string;
      integrationName: string;
      scopeKey: string;
      allowed: boolean;
      connected: boolean;
    }>;
  };
};

export default function IntegrationsPage() {
  const { data, error, loading, reload } = useAsyncResource(
    () => api<MatrixPayload>("/api/integrations"),
    []
  );

  async function toggleStatus(id: string, status: string) {
    await api("/api/integrations", {
      method: "PATCH",
      body: JSON.stringify({
        id,
        status: status === "connected" ? "disconnected" : "connected",
      }),
    });
    await reload();
  }

  async function togglePermission(
    integrationId: string,
    scopeKey: string,
    allowed: boolean
  ) {
    await api("/api/integrations", {
      method: "PATCH",
      body: JSON.stringify({
        integrationId,
        scopeKey,
        allowed: !allowed,
      }),
    });
    await reload();
  }

  const matrix = data?.matrix;

  return (
    <div className="shell section stack">
      <div>
        <p className="eyebrow">Integrations</p>
        <h2 className="page-title">Who can see what?</h2>
        <p className="muted" style={{ maxWidth: "40rem", lineHeight: 1.55 }}>
          Connect tools, then allow scopes intentionally. Permission is a
          matrix — not a decorative card wall.
        </p>
      </div>

      {loading && <p className="muted">Loading integrations…</p>}
      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}

      {matrix && (
        <>
          <div className="grid-2">
            <div className="panel stack">
              <p className="eyebrow">Connect</p>
              {(data?.integrations || []).map((item) => (
                <div key={item.id} className="list-row">
                  <div style={{ display: "grid", gap: "0.35rem" }}>
                    <strong>{item.name}</strong>
                    <StateBadge
                      state={
                        item.status === "connected"
                          ? "connected"
                          : "disconnected"
                      }
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => void toggleStatus(item.id, item.status)}
                  >
                    {item.status === "connected" ? "Disconnect" : "Connect"}
                  </button>
                </div>
              ))}
              <Link href="/vault/preview" className="btn btn-primary">
                Preview a share
              </Link>
            </div>
            <div className="panel stack">
              <p className="eyebrow">Signature flow</p>
              <ContextFlow
                from="Allowed scopes"
                to="Connected AI"
                label="Context moves only across allowed cells"
              />
              <p className="muted" style={{ margin: 0, lineHeight: 1.5 }}>
                ● allowed · ○ restricted. Color is reinforced by the glyph so
                status never depends on hue alone.
              </p>
            </div>
          </div>

          <div className="panel" style={{ overflowX: "auto" }}>
            <table className="permission-matrix">
              <thead>
                <tr>
                  <th scope="col">Integration</th>
                  {matrix.scopes.map((scope) => (
                    <th key={scope} scope="col">
                      {scope}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.integrations.map((integration) => (
                  <tr key={integration.id}>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.55rem",
                          alignItems: "center",
                        }}
                      >
                        <span>{integration.name}</span>
                        <StateBadge
                          state={
                            integration.status === "connected"
                              ? "connected"
                              : "disconnected"
                          }
                        />
                      </div>
                    </td>
                    {matrix.scopes.map((scope) => {
                      const cell = matrix.cells.find(
                        (c) =>
                          c.integrationId === integration.id &&
                          c.scopeKey === scope
                      );
                      const allowed = cell?.allowed ?? false;
                      return (
                        <td key={`${integration.id}-${scope}`}>
                          <button
                            type="button"
                            className={`perm-toggle${allowed ? " is-on" : ""}`}
                            aria-pressed={allowed}
                            aria-label={`${integration.name} ${scope} ${allowed ? "allowed" : "restricted"}`}
                            onClick={() =>
                              void togglePermission(
                                integration.id,
                                scope,
                                allowed
                              )
                            }
                          >
                            {allowed ? "●" : "○"}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
