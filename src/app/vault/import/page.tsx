"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/client";
import type { Project, SourceType } from "@/lib/types";

type ImportResult = {
  source: { id: string; title: string };
  extraction: {
    preferences: string[];
    decisions: string[];
    knowledge: Array<{ title: string }>;
    profileUpdates: Record<string, unknown>;
  };
  created: {
    preferences: unknown[];
    decisions: unknown[];
    items: unknown[];
  };
};

export default function ImportPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<SourceType>("conversation");
  const [content, setContent] = useState("");
  const [applyExtraction, setApplyExtraction] = useState(true);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void api<Project[]>("/api/projects").then(setProjects);
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const imported = await api<ImportResult>("/api/import", {
        method: "POST",
        body: JSON.stringify({
          content,
          title,
          type,
          projectId: projectId || null,
          applyExtraction,
        }),
      });
      setResult(imported);
      setContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="shell section stack">
      <div>
        <p className="eyebrow">Import</p>
        <h2 className="page-title">Bring notes and conversations in</h2>
        <p className="muted">
          Paste text once. IPCL extracts reusable profile updates, preferences,
          decisions, and knowledge fragments.
        </p>
      </div>

      <form className="panel stack" onSubmit={onSubmit}>
        <div className="grid-2">
          <label>
            <span className="field-label">Source type</span>
            <select
              className="field"
              value={type}
              onChange={(e) => setType(e.target.value as SourceType)}
            >
              <option value="conversation">Conversation</option>
              <option value="document">Document</option>
              <option value="note">Note</option>
              <option value="readme">Repository README</option>
            </select>
          </label>
          <label>
            <span className="field-label">Project (optional)</span>
            <select
              className="field"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          <span className="field-label">Title</span>
          <input
            className="field"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Chat with Claude about billing"
          />
        </label>
        <label>
          <span className="field-label">Content</span>
          <textarea
            className="field"
            rows={12}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            placeholder={`I am a product engineer.\nPrefer concise answers.\nDecision: Paypace uses monthly and yearly subscriptions.\nWe use TypeScript and Next.js.`}
          />
        </label>
        <label style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
          <input
            type="checkbox"
            checked={applyExtraction}
            onChange={(e) => setApplyExtraction(e.target.checked)}
          />
          <span>AI-assisted extraction into reusable vault entities</span>
        </label>
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? "Importing…" : "Import into vault"}
        </button>
        {error && <p style={{ color: "var(--danger)", margin: 0 }}>{error}</p>}
      </form>

      {result && (
        <div className="panel stack fade-up">
          <h3 style={{ margin: 0, fontSize: "1.35rem" }}>
            Extraction complete
          </h3>
          <p className="muted" style={{ margin: 0 }}>
            Source saved as <strong>{result.source.title}</strong>. Created{" "}
            {result.created.preferences.length} preferences,{" "}
            {result.created.decisions.length} decisions, and{" "}
            {result.created.items.length} searchable fragments.
          </p>
        </div>
      )}
    </div>
  );
}
