"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, useAsyncResource } from "@/lib/client";
import type {
  AuditEvent,
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

export default function SecurityPage() {
  const integrations = useAsyncResource(() => api<Integration[]>("/api/integrations"), []);
  const audit = useAsyncResource(() => api<AuditEvent[]>("/api/audit?limit=30"), []);
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ensure login
    void api("/api/auth").catch(() => undefined);
  }, []);

  async function connectIntegration(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIssuedToken(null);
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
      await integrations.reload();
      await audit.reload();
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
    await audit.reload();
  }

  async function rotate(id: string) {
    const result = await api<{ token: string }>("/api/integrations", {
      method: "POST",
      body: JSON.stringify({ action: "rotate", id }),
    });
    setIssuedToken(result.token);
    await integrations.reload();
    await audit.reload();
  }

  async function resolveCandidate(id: string, decision: "approved" | "rejected") {
    await api("/api/candidates", {
      method: "POST",
      body: JSON.stringify({ id, decision }),
    });
    await candidates.reload();
    await audit.reload();
  }

  async function logout() {
    await api("/api/auth", {
      method: "POST",
      body: JSON.stringify({ action: "logout" }),
    });
    window.location.href = "/vault/login";
  }

  async function deleteAccount() {
    if (
      !confirm(
        "Delete this vault owner and all associated memories, sources, and integrations?"
      )
    ) {
      return;
    }
    await api("/api/auth", {
      method: "POST",
      body: JSON.stringify({ action: "delete_account" }),
    });
    window.location.href = "/vault/login";
  }

  return (
    <div className="shell section stack">
      <div className="fade-up">
        <p className="pill">ADR-003</p>
        <h2>Security & sharing</h2>
        <p className="muted" style={{ maxWidth: "40rem", lineHeight: 1.55 }}>
          Default deny. Each AI connection gets explicit scopes. Restricted
          memories never enter normal retrieval. Writes from AI stay as
          candidates until you approve them.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button className="btn btn-ghost" onClick={() => void logout()}>
            Sign out
          </button>
          <button className="btn btn-ghost" onClick={() => void deleteAccount()}>
            Delete account
          </button>
        </div>
      </div>

      <form className="panel stack fade-up-delay" onSubmit={connectIntegration}>
        <h3 className="font-display" style={{ margin: 0, fontSize: "1.35rem" }}>
          Connect an AI
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
        {issuedToken && (
          <div className="panel" style={{ background: "rgba(0,0,0,0.04)" }}>
            <p className="field-label">Integration token (copy once)</p>
            <code style={{ wordBreak: "break-all" }}>{issuedToken}</code>
            <p className="muted" style={{ marginTop: "0.75rem" }}>
              Set <code>IPCL_INTEGRATION_TOKEN</code> in your MCP config.
            </p>
          </div>
        )}
      </form>

      <div className="panel stack">
        <h3 className="font-display" style={{ margin: 0, fontSize: "1.35rem" }}>
          Connected integrations
        </h3>
        {integrations.loading && <p className="muted">Loading…</p>}
        {integrations.data?.length === 0 && (
          <p className="muted">No integrations yet.</p>
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
                {item.revokedAt ? " · revoked" : ""} · token {item.tokenHint}
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
          Candidate memories
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

      <div className="panel stack">
        <h3 className="font-display" style={{ margin: 0, fontSize: "1.35rem" }}>
          Security activity
        </h3>
        {audit.data?.map((event) => (
          <div key={event.id} className="list-row">
            <div>
              <strong>{event.action}</strong>
              <div className="muted" style={{ fontSize: "0.85rem" }}>
                {event.createdAt}
                {event.scope ? ` · ${event.scope}` : ""}
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
