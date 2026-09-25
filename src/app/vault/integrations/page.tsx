"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { api, useAsyncResource } from "@/lib/client";
import type {
  CandidateMemory,
  Integration,
  IntegrationAccessMode,
  IntegrationScope,
  Project,
} from "@/lib/types";

const DEFAULT_READ_SCOPES: IntegrationScope[] = [
  "profile:read",
  "preferences:read",
  "projects:read",
  "decisions:read",
  "context:search",
];

export default function IntegrationsPage() {
  const integrations = useAsyncResource(() => api<Integration[]>("/api/integrations"), []);
  const candidates = useAsyncResource(
    () => api<CandidateMemory[]>("/api/candidates"),
    []
  );
  const projects = useAsyncResource(() => api<Project[]>("/api/projects"), []);

  const [name, setName] = useState("Cursor");
  const [provider, setProvider] = useState("cursor");
  const [accessMode, setAccessMode] = useState<IntegrationAccessMode>("READ_ONLY");
  const [allowSensitive, setAllowSensitive] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [allProjects, setAllProjects] = useState(true);
  const [issuedToken, setIssuedToken] = useState<string | null>(null);
  const [mcpConfig, setMcpConfig] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"token" | "config" | null>(null);

  useEffect(() => {
    void api("/api/auth").catch(() => undefined);
  }, []);

  const activeIntegrations = useMemo(
    () => integrations.data?.filter((i) => !i.revokedAt) ?? [],
    [integrations.data]
  );

  async function refreshMcpConfig(token: string) {
    const config = await api<Record<string, unknown>>("/api/control-plane", {
      method: "POST",
      body: JSON.stringify({ action: "mcp_config", token }),
    });
    setMcpConfig(JSON.stringify(config, null, 2));
  }

  async function connectIntegration(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIssuedToken(null);
    setMcpConfig(null);
    try {
      const result = await api<{ integration: Integration; token: string }>(
        "/api/integrations",
        {
          method: "POST",
          body: JSON.stringify({
            action: "create",
            name,
            provider,
            accessMode,
            scopes: DEFAULT_READ_SCOPES.concat(
              accessMode === "READ_WRITE"
                ? ["context:write", "memory:create"]
                : []
            ),
            allowedProjectIds: allProjects ? null : selectedProjects,
            allowedClassifications: allowSensitive
              ? ["NORMAL", "SENSITIVE"]
              : ["NORMAL"],
          }),
        }
      );
      setIssuedToken(result.token);
      await refreshMcpConfig(result.token);
      await integrations.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
    }
  }

  async function revoke(id: string) {
    await api("/api/integrations", {
      method: "POST",
      body: JSON.stringify({ action: "revoke", id }),
    });
    await integrations.reload();
  }

  async function rotate(id: string) {
    const result = await api<{ token: string }>("/api/integrations", {
      method: "POST",
      body: JSON.stringify({ action: "rotate", id }),
    });
    setIssuedToken(result.token);
    await refreshMcpConfig(result.token);
    await integrations.reload();
  }

  async function resolveCandidate(id: string, decision: "approved" | "rejected") {
    await api("/api/candidates", {
      method: "POST",
      body: JSON.stringify({ id, decision }),
    });
    await candidates.reload();
  }

  async function copyText(kind: "token" | "config", value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(kind);
    setTimeout(() => setCopied(null), 1600);
  }

  return (
    <div className="shell section stack">
      <div className="fade-up">
        <p className="pill">Optional</p>
        <h2>MCP connect (advanced)</h2>
        <p className="muted" style={{ maxWidth: "40rem", lineHeight: 1.55 }}>
          Most people should skip this. Daily path:{" "}
          <a href="/vault/preview">Use in AI</a> → copy → paste into Cursor.
          MCP is for local desktop setups with a repo clone — Fly-hosted vaults
          emit a container path that will not work on your phone or laptop.
        </p>
        <Link className="btn btn-primary" href="/vault/preview">
          Go to Use in AI instead
        </Link>
      </div>

      <form className="panel stack fade-up-delay" onSubmit={connectIntegration}>
        <h3 className="font-display" style={{ margin: 0, fontSize: "1.35rem" }}>
          Issue an integration
        </h3>
        <label>
          <span className="field-label">Name</span>
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          <span className="field-label">Provider</span>
          <input
            className="field"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            placeholder="cursor, claude, chatgpt…"
          />
        </label>
        <label>
          <span className="field-label">Access</span>
          <select
            className="field"
            value={accessMode}
            onChange={(e) => setAccessMode(e.target.value as IntegrationAccessMode)}
          >
            <option value="READ_ONLY">Read only (default)</option>
            <option value="READ_WRITE">Read + write (candidates)</option>
          </select>
        </label>
        <label style={{ display: "flex", gap: "0.55rem", alignItems: "center" }}>
          <input
            type="checkbox"
            checked={allowSensitive}
            onChange={(e) => setAllowSensitive(e.target.checked)}
          />
          Allow SENSITIVE classification
        </label>
        <label style={{ display: "flex", gap: "0.55rem", alignItems: "center" }}>
          <input
            type="checkbox"
            checked={allProjects}
            onChange={(e) => setAllProjects(e.target.checked)}
          />
          All projects
        </label>
        {!allProjects && projects.data && (
          <div className="stack" style={{ gap: "0.35rem" }}>
            {projects.data.map((p) => (
              <label
                key={p.id}
                style={{ display: "flex", gap: "0.55rem", alignItems: "center" }}
              >
                <input
                  type="checkbox"
                  checked={selectedProjects.includes(p.id)}
                  onChange={(e) => {
                    setSelectedProjects((prev) =>
                      e.target.checked
                        ? [...prev, p.id]
                        : prev.filter((id) => id !== p.id)
                    );
                  }}
                />
                {p.name}
              </label>
            ))}
          </div>
        )}
        {error && <p style={{ color: "#8a2f2f" }}>{error}</p>}
        <button className="btn btn-primary" type="submit">
          Connect
        </button>
      </form>

      {issuedToken && (
        <div className="panel stack fade-up">
          <h3 className="font-display" style={{ margin: 0, fontSize: "1.35rem" }}>
            MCP connect wizard
          </h3>
          <p className="muted" style={{ margin: 0, lineHeight: 1.5 }}>
            Copy the token once. Paste the JSON into <strong>Cursor Desktop →
            Settings → MCP</strong> (not the mobile Plugins marketplace). Replace
            <code>cwd: /app</code> with your local repo path, or skip MCP and use{" "}
            <a href="/vault/preview">Use in AI</a>.
          </p>
          <div>
            <p className="field-label">Integration token</p>
            <code style={{ wordBreak: "break-all", display: "block" }}>{issuedToken}</code>
            <button
              className="btn btn-ghost"
              style={{ marginTop: "0.6rem" }}
              type="button"
              onClick={() => void copyText("token", issuedToken)}
            >
              {copied === "token" ? "Copied" : "Copy token"}
            </button>
          </div>
          {mcpConfig && (
            <div>
              <p className="field-label">MCP client config</p>
              <pre
                style={{
                  margin: 0,
                  padding: "0.85rem",
                  overflow: "auto",
                  background: "rgba(0,0,0,0.04)",
                  borderRadius: "0.6rem",
                  fontSize: "0.85rem",
                }}
              >
                {mcpConfig}
              </pre>
              <button
                className="btn btn-ghost"
                style={{ marginTop: "0.6rem" }}
                type="button"
                onClick={() => void copyText("config", mcpConfig)}
              >
                {copied === "config" ? "Copied" : "Copy config JSON"}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="panel stack">
        <h3 className="font-display" style={{ margin: 0, fontSize: "1.35rem" }}>
          Connected integrations
        </h3>
        {integrations.loading && <p className="muted">Loading…</p>}
        {activeIntegrations.length === 0 && (
          <p className="muted">No active integrations yet.</p>
        )}
        {integrations.data?.map((item) => (
          <div key={item.id} className="list-row" style={{ alignItems: "flex-start" }}>
            <div>
              <strong>
                {item.name}{" "}
                <span className="muted">({item.provider})</span>
              </strong>
              <div className="muted" style={{ fontSize: "0.9rem" }}>
                {item.accessMode}
                {item.revokedAt ? " · revoked" : ""} · scopes {item.scopes.join(", ")}
                {" · "}token {item.tokenHint}
              </div>
            </div>
            {!item.revokedAt && (
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button className="btn btn-ghost" onClick={() => void rotate(item.id)}>
                  Rotate
                </button>
                <button className="btn btn-ghost" onClick={() => void revoke(item.id)}>
                  Revoke
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="panel stack">
        <h3 className="font-display" style={{ margin: 0, fontSize: "1.35rem" }}>
          Candidate memories from AI writes
        </h3>
        {candidates.data?.length === 0 && (
          <p className="muted">No pending AI write proposals.</p>
        )}
        {candidates.data?.map((c) => (
          <div key={c.id} className="list-row" style={{ alignItems: "flex-start" }}>
            <div>
              <strong>
                {c.title} · {c.kind}
              </strong>
              <div className="muted" style={{ whiteSpace: "pre-wrap" }}>
                {c.content}
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.4rem" }}>
              <button
                className="btn btn-primary"
                onClick={() => void resolveCandidate(c.id, "approved")}
              >
                Approve
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => void resolveCandidate(c.id, "rejected")}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
