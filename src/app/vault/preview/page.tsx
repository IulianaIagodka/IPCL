"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/client";
import type { PreviewPayload, Project } from "@/lib/types";
import { ContextFlow } from "@/components/ContextFlow";
import { MemoryCard } from "@/components/MemoryCard";
import { StateBadge } from "@/components/StateBadge";

export default function PreviewPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [destination, setDestination] = useState("Cursor");
  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState("");
  const [includeProfile, setIncludeProfile] = useState(true);
  const [includePreferences, setIncludePreferences] = useState(true);
  const [includeDecisions, setIncludeDecisions] = useState(true);
  const [includeSearchHits, setIncludeSearchHits] = useState(true);
  const [preview, setPreview] = useState<PreviewPayload | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acknowledgeSensitive, setAcknowledgeSensitive] = useState(false);

  useEffect(() => {
    void api<Project[]>("/api/projects").then(setProjects);
  }, []);

  async function onPreview(event: FormEvent) {
    event.preventDefault();
    setCopied(false);
    setError(null);
    try {
      const payload = await api<PreviewPayload>("/api/preview", {
        method: "POST",
        body: JSON.stringify({
          destination,
          query: query || null,
          projectId: projectId || null,
          includeProfile,
          includePreferences,
          includeDecisions,
          includeSearchHits,
          acknowledgeSensitive,
        }),
      });
      setPreview(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed");
    }
  }

  async function copyExport() {
    if (!preview || preview.requiresSensitiveAck) return;
    await navigator.clipboard.writeText(preview.exportText);
    setCopied(true);
  }

  const projectName =
    projects.find((p) => p.id === projectId)?.name || "Global";

  return (
    <div className="shell section stack">
      <div>
        <p className="eyebrow">Use in AI</p>
        <h2 className="page-title">Copy context into your chat</h2>
        <p className="muted" style={{ maxWidth: "36rem", lineHeight: 1.55 }}>
          1) Topic · 2) Build · 3) Copy · 4) Paste at the top of Cursor or
          ChatGPT. No MCP required.
        </p>
      </div>

      <form className="panel stack" onSubmit={onPreview}>
        <label>
          <span className="field-label">Where will you paste this?</span>
          <input
            className="field"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Cursor, ChatGPT, Claude…"
          />
        </label>
        <label>
          <span className="field-label">What are you working on?</span>
          <input
            className="field"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. pricing page, onboarding, billing"
          />
        </label>
        <label>
          <span className="field-label">Project (optional)</span>
          <select
            className="field"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">All</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <details>
          <summary className="muted" style={{ cursor: "pointer" }}>
            Advanced includes
          </summary>
          <div className="stack" style={{ gap: "0.55rem", marginTop: "0.75rem" }}>
            <Toggle
              label="Profile"
              checked={includeProfile}
              onChange={setIncludeProfile}
            />
            <Toggle
              label="Preferences"
              checked={includePreferences}
              onChange={setIncludePreferences}
            />
            <Toggle
              label="Decisions"
              checked={includeDecisions}
              onChange={setIncludeDecisions}
            />
            <Toggle
              label="Search hits for topic"
              checked={includeSearchHits}
              onChange={setIncludeSearchHits}
            />
          </div>
        </details>
        <button className="btn btn-primary" type="submit">
          Build &amp; show text
        </button>
        {error && <p style={{ color: "var(--danger)", margin: 0 }}>{error}</p>}
      </form>

      {preview && (
        <div className="grid-2 fade-up">
          <div className="panel stack">
            <p className="eyebrow">Transfer</p>
            <ContextFlow
              from={projectName}
              to={preview.destination}
              label={`${preview.fragments.length} memories · ~${preview.estimatedTokens} tokens`}
            />
            <div className="list-row" style={{ padding: "0.55rem 0" }}>
              <span>Status</span>
              <StateBadge
                state={preview.includesSensitive ? "restricted" : "shared"}
                label={
                  preview.requiresSensitiveAck
                    ? "ACK REQUIRED"
                    : "PREVIEW ONLY"
                }
              />
            </div>
            {preview.includesSensitive && (
              <div className="stack" style={{ gap: "0.5rem" }}>
                <p style={{ color: "var(--danger)", margin: 0 }}>
                  This share includes SENSITIVE context leaving the vault.
                </p>
                <Toggle
                  label="I acknowledge sensitive context will be sent to an external AI"
                  checked={acknowledgeSensitive}
                  onChange={setAcknowledgeSensitive}
                />
                {preview.requiresSensitiveAck && (
                  <button
                    className="btn btn-ghost"
                    type="button"
                    onClick={() =>
                      void onPreview({ preventDefault() {} } as FormEvent)
                    }
                  >
                    Rebuild export with acknowledgment
                  </button>
                )}
              </div>
            )}
            <div className="stack" style={{ gap: "0.65rem" }}>
              {preview.fragments.map((fragment, index) => (
                <MemoryCard
                  key={`${fragment.source}-${index}`}
                  memory={{
                    id: `${index}`,
                    kind: String(fragment.kind),
                    title:
                      fragment.classification !== "NORMAL"
                        ? `${fragment.title} · ${fragment.classification}`
                        : fragment.title,
                    content: fragment.content,
                    projectName,
                    sourceLabel: fragment.source,
                    updatedAt: new Date().toISOString(),
                  }}
                />
              ))}
            </div>
          </div>

          <div className="panel stack">
            <p className="eyebrow">Copy / export fallback</p>
            <textarea
              className="field"
              rows={18}
              readOnly
              value={preview.exportText}
            />
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => void copyExport()}
                disabled={Boolean(preview.requiresSensitiveAck)}
              >
                {copied ? "Copied" : "Copy for AI"}
              </button>
              <a
                className="btn btn-ghost"
                href={`/api/export?format=text${projectId ? `&projectId=${projectId}` : ""}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
              >
                Download markdown
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}
