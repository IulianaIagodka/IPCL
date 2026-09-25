"use client";

import { FormEvent, useMemo, useState } from "react";
import { api, useAsyncResource } from "@/lib/client";
import { MemoryCard } from "@/components/MemoryCard";
import type { Project } from "@/lib/types";

type MemoriesPayload = {
  memories: Array<{
    id: string;
    kind: string;
    title: string;
    content: string;
    projectName: string | null;
    sourceLabel: string | null;
    updatedAt: string;
    projectId: string | null;
    tags: string[];
  }>;
  projects: Project[];
};

type SearchHit = {
  item: {
    id: string;
    kind: string;
    title: string;
    content: string;
    projectId: string | null;
    updatedAt: string;
    tags: string[];
  };
  score: number;
};

export default function ContextPage() {
  const { data, error, loading } = useAsyncResource(
    () => api<MemoriesPayload>("/api/memories"),
    []
  );
  const [scope, setScope] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const scopes = useMemo(() => {
    const names = (data?.projects || []).map((p) => ({
      key: p.id,
      label: p.name,
    }));
    return [
      { key: "all", label: "All" },
      { key: "me", label: "Me" },
      ...names,
    ];
  }, [data]);

  const filtered = useMemo(() => {
    const memories = data?.memories || [];
    if (scope === "all") return memories;
    if (scope === "me") {
      return memories.filter(
        (m) => !m.projectId || m.kind === "profile" || m.kind === "preference"
      );
    }
    return memories.filter((m) => m.projectId === scope);
  }, [data, scope]);

  async function onSearch(event: FormEvent) {
    event.preventDefault();
    setSearchError(null);
    try {
      const params = new URLSearchParams({ q: query });
      if (scope !== "all" && scope !== "me") params.set("projectId", scope);
      const results = await api<SearchHit[]>(`/api/search?${params}`);
      setHits(results);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Search failed");
    }
  }

  return (
    <div className="shell section stack">
      <div>
        <p className="eyebrow">Context</p>
        <h2 className="page-title">What your AI knows</h2>
        <p className="muted">
          Search and inspect memories by scope — not folders.
        </p>
      </div>

      <form className="panel stack" onSubmit={onSearch}>
        <label>
          <span className="field-label">Search your context</span>
          <input
            className="field"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="pricing subscriptions architecture…"
          />
        </label>
        <div className="scope-tabs" role="tablist" aria-label="Context scopes">
          {scopes.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`scope-tab${scope === item.key ? " is-active" : ""}`}
              onClick={() => {
                setScope(item.key);
                setHits(null);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button className="btn btn-primary" type="submit" disabled={!query.trim()}>
          Search
        </button>
        {searchError && (
          <p style={{ color: "var(--danger)", margin: 0 }}>{searchError}</p>
        )}
      </form>

      {hits && (
        <div className="panel stack">
          <p className="eyebrow">Search results</p>
          {hits.length === 0 && <p className="muted">No matching memories.</p>}
          <div className="stack" style={{ gap: "0.65rem" }}>
            {hits.map((hit) => (
              <MemoryCard
                key={hit.item.id}
                memory={{
                  ...hit.item,
                  projectName:
                    data?.projects.find((p) => p.id === hit.item.projectId)
                      ?.name ?? null,
                  sourceLabel: `${Math.round(hit.score * 100)}% match`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="stack">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "1rem",
            alignItems: "baseline",
          }}
        >
          <p className="eyebrow" style={{ margin: 0 }}>
            Memories in scope
          </p>
          <span className="meta-quiet">{filtered.length} items</span>
        </div>
        {loading && <p className="muted">Loading memories…</p>}
        {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
        {!loading && filtered.length === 0 && (
          <div className="panel">
            <p className="muted" style={{ margin: 0 }}>
              This scope is empty. Import notes or create a decision in a
              project.
            </p>
          </div>
        )}
        <div className="stack" style={{ gap: "0.65rem" }}>
          {filtered.map((memory) => (
            <MemoryCard key={memory.id} memory={memory} />
          ))}
        </div>
      </div>
    </div>
  );
}
