"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/client";
import type { Project, SearchHit } from "@/lib/types";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    void api<Project[]>("/api/projects").then(setProjects);
  }, []);

  async function onSearch(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSearched(true);
    try {
      const params = new URLSearchParams({ q: query });
      if (projectId) params.set("projectId", projectId);
      const results = await api<SearchHit[]>(`/api/search?${params}`);
      setHits(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    }
  }

  return (
    <div className="shell section stack">
      <div>
        <p className="pill">Retrieval</p>
        <h2>Semantic context search</h2>
        <p className="muted">
          Retrieve only relevant fragments—not the entire vault—for each
          request.
        </p>
      </div>

      <form className="panel stack" onSubmit={onSearch}>
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
        <button className="btn btn-primary" type="submit">
          Search context
        </button>
        {error && <p style={{ color: "#8a2f2f", margin: 0 }}>{error}</p>}
      </form>

      <div className="panel">
        {!searched && <p className="muted">Results will appear here.</p>}
        {searched && hits.length === 0 && (
          <p className="muted">No matching fragments.</p>
        )}
        {hits.map((hit) => (
          <div key={hit.item.id} className="list-row">
            <div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <strong>{hit.item.title || hit.item.kind}</strong>
                <span className="pill">{hit.item.kind}</span>
              </div>
              <p className="muted" style={{ margin: "0.4rem 0 0", lineHeight: 1.5 }}>
                {hit.item.content}
              </p>
            </div>
            <span className="muted" style={{ whiteSpace: "nowrap" }}>
              {(hit.score * 100).toFixed(0)}% · {hit.matchedOn.join("+")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
