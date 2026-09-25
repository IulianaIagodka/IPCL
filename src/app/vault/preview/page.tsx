"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/client";
import type { PreviewPayload, Project } from "@/lib/types";

export default function PreviewPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [destination, setDestination] = useState("Claude / Cursor paste");
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

  return (
    <div className="shell section stack">
      <div>
        <p className="pill">Privacy</p>
        <h2>See exactly what will be shared</h2>
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
        {error && <p style={{ color: "#8a2f2f", margin: 0 }}>{error}</p>}
      </form>

      {preview && (
        <div className="grid-2 fade-up">
          <div className="panel stack">
            <h3 className="font-display" style={{ margin: 0, fontSize: "1.35rem" }}>
              Share plan
            </h3>
            <p className="muted" style={{ margin: 0 }}>
              Destination: <strong>{preview.destination}</strong>
            </p>
            <p className="muted" style={{ margin: 0 }}>
              Estimated tokens: <strong>{preview.estimatedTokens}</strong>
            </p>
            <p className="muted" style={{ margin: 0 }}>
              Fragments: <strong>{preview.fragments.length}</strong>
            </p>
            {preview.includesSensitive && (
              <div className="stack" style={{ gap: "0.5rem" }}>
                <p style={{ color: "#8a2f2f", margin: 0 }}>
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
                    onClick={() => void onPreview({ preventDefault() {} } as FormEvent)}
                  >
                    Rebuild export with acknowledgment
                  </button>
                )}
              </div>
            )}
            <div>
              {preview.fragments.map((fragment, index) => (
                <div key={`${fragment.source}-${index}`} className="list-row">
                  <div>
                    <strong>
                      {fragment.title}{" "}
                      <span className="pill">{fragment.kind}</span>
                      {fragment.classification !== "NORMAL" && (
                        <span className="pill">{fragment.classification}</span>
                      )}
                    </strong>
                    <p className="muted" style={{ margin: "0.35rem 0 0", whiteSpace: "pre-wrap" }}>
                      {fragment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel stack">
            <h3 className="font-display" style={{ margin: 0, fontSize: "1.35rem" }}>
              Copy / export fallback
            </h3>
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
