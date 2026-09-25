"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/client";
import type { PreviewPayload, Project } from "@/lib/types";
import { ContextFlow } from "@/components/ContextFlow";
import { MemoryCard } from "@/components/MemoryCard";
import { StateBadge } from "@/components/StateBadge";

export default function PreviewPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [destination, setDestination] = useState("Claude");
  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState("");
  const [includeProfile, setIncludeProfile] = useState(true);
  const [includePreferences, setIncludePreferences] = useState(true);
  const [includeDecisions, setIncludeDecisions] = useState(true);
  const [includeSearchHits, setIncludeSearchHits] = useState(true);
  const [preview, setPreview] = useState<PreviewPayload | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        }),
      });
      setPreview(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed");
    }
  }

  async function copyExport() {
    if (!preview) return;
    await navigator.clipboard.writeText(preview.exportText);
    setCopied(true);
  }

  const projectName =
    projects.find((p) => p.id === projectId)?.name || "Global";

  return (
    <div className="shell section stack">
      <div>
        <p className="eyebrow">Share preview</p>
        <h2 className="page-title">See exactly what will be shared</h2>
        <p className="muted">
          What AI is asking for → what context will be sent → where it is going.
        </p>
      </div>

      <form className="panel stack" onSubmit={onPreview}>
        <label>
          <span className="field-label">Destination</span>
          <input
            className="field"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="ChatGPT, Claude, Cursor, Gemini…"
          />
        </label>
        <label>
          <span className="field-label">Intent / topic query</span>
          <input
            className="field"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="billing subscriptions architecture"
          />
        </label>
        <label>
          <span className="field-label">Project</span>
          <select
            className="field"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">None / all</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <div className="stack" style={{ gap: "0.55rem" }}>
          <Toggle
            label="Include profile"
            checked={includeProfile}
            onChange={setIncludeProfile}
          />
          <Toggle
            label="Include preferences"
            checked={includePreferences}
            onChange={setIncludePreferences}
          />
          <Toggle
            label="Include decisions"
            checked={includeDecisions}
            onChange={setIncludeDecisions}
          />
          <Toggle
            label="Include search hits for query"
            checked={includeSearchHits}
            onChange={setIncludeSearchHits}
          />
        </div>
        <button className="btn btn-primary" type="submit">
          Build preview
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
              <StateBadge state="shared" label="PREVIEW ONLY" />
            </div>
            <div className="stack" style={{ gap: "0.65rem" }}>
              {preview.fragments.map((fragment, index) => (
                <MemoryCard
                  key={`${fragment.source}-${index}`}
                  memory={{
                    id: `${index}`,
                    kind: String(fragment.kind),
                    title: fragment.title,
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
