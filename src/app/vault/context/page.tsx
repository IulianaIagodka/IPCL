"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { api, useAsyncResource } from "@/lib/client";
import type { ContextItem, Project, SearchHit } from "@/lib/types";

export default function ContextPage() {
  const memories = useAsyncResource(
    () => api<ContextItem[]>("/api/context"),
    []
  );
  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    void api<Project[]>("/api/projects").then(setProjects).catch(() => undefined);
  }, []);

  async function onSearch(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSearched(true);
    try {
      const params = new URLSearchParams({ q: query });
      if (projectId) params.set("projectId", projectId);
      setHits(await api<SearchHit[]>(`/api/search?${params}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    }
  }

  return (
    <div className="shell section stack">
      <div className="fade-up">
        <p className="pill">Context</p>
        <h2>What your AI can know</h2>
        <p className="muted" style={{ maxWidth: "40rem", lineHeight: 1.55 }}>
          Inspect stored memory and retrieve only the fragments that match a
          query. Editing happens here; chat happens in your AI tools.
        </p>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <Link className="btn btn-ghost" href="/vault/import">
            Import source
          </Link>
          <Link className="btn btn-ghost" href="/vault/profile">
            Edit profile
          </Link>
          <Link className="btn btn-ghost" href="/vault/search">
            Classic search
          </Link>
        </div>
      </div>

      <form className="panel stack fade-up-delay" onSubmit={onSearch}>
        <h3 className="font-display" style={{ margin: 0, fontSize: "1.35rem" }}>
          Retrieve relevant fragments
        </h3>
        <label>
          <span className="field-label">Query</span>
          <input
            className="field"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="subscription billing decisions"
            required
          />
        </label>
        <label>
          <span className="field-label">Limit to project</span>
          <select
            className="field"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        {error && <p style={{ color: "#8a2f2f" }}>{error}</p>}
        <button className="btn btn-primary" type="submit">
          Search context
        </button>
      </form>

      {searched && (
        <div className="panel stack">
          <h3 className="font-display" style={{ margin: 0, fontSize: "1.25rem" }}>
            Retrieval results
          </h3>
          {hits.length === 0 && <p className="muted">No matching fragments.</p>}
          {hits.map((hit) => (
            <div key={hit.item.id} className="list-row" style={{ alignItems: "flex-start" }}>
              <div>
                <strong>
                  {hit.item.kind}
                  {hit.item.title ? ` · ${hit.item.title}` : ""}
                </strong>
                <div className="muted" style={{ whiteSpace: "pre-wrap" }}>
                  {hit.item.content}
                </div>
              </div>
              <span className="muted">{hit.score.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="panel stack">
        <h3 className="font-display" style={{ margin: 0, fontSize: "1.25rem" }}>
          Recent memory
        </h3>
        {memories.loading && <p className="muted">Loading…</p>}
        {memories.data?.length === 0 && (
          <p className="muted">No context items yet. Import a source or add notes.</p>
        )}
        {memories.data?.slice(0, 25).map((item) => (
          <div key={item.id} className="list-row" style={{ alignItems: "flex-start" }}>
            <div>
              <strong>
                {item.kind}
                {item.title ? ` · ${item.title}` : ""}
              </strong>
              <div className="muted" style={{ whiteSpace: "pre-wrap" }}>
                {item.content.slice(0, 280)}
                {item.content.length > 280 ? "…" : ""}
              </div>
            </div>
            <span className="muted">{item.classification}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
