"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { api, useAsyncResource } from "@/lib/client";
import type { Project } from "@/lib/types";

export default function ProjectsPage() {
  const { data, error, loading, reload } = useAsyncResource(
    () => api<Project[]>("/api/projects"),
    []
  );
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [stack, setStack] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    try {
      await api<Project>("/api/projects", {
        method: "POST",
        body: JSON.stringify({
          name,
          description,
          technologyStack: stack
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      setName("");
      setDescription("");
      setStack("");
      await reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Create failed");
    }
  }

  async function onDelete(id: string) {
    await api(`/api/projects/${id}`, { method: "DELETE" });
    await reload();
  }

  return (
    <div className="shell section stack">
      <div>
        <p className="pill">Projects</p>
        <h2>Project-scoped context</h2>
        <p className="muted">
          Product description, stack, users, architecture, and constraints.
        </p>
      </div>

      <div className="grid-2">
        <form className="panel stack" onSubmit={onCreate}>
          <h3 className="font-display" style={{ margin: 0, fontSize: "1.35rem" }}>
            Create project
          </h3>
          <label>
            <span className="field-label">Name</span>
            <input
              className="field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Paypace"
            />
          </label>
          <label>
            <span className="field-label">Description</span>
            <textarea
              className="field"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <label>
            <span className="field-label">Technology stack</span>
            <input
              className="field"
              value={stack}
              onChange={(e) => setStack(e.target.value)}
              placeholder="Next.js, SQLite, MCP"
            />
          </label>
          <button className="btn btn-primary" type="submit">
            Create project
          </button>
          {formError && <p style={{ color: "#8a2f2f", margin: 0 }}>{formError}</p>}
        </form>

        <div className="panel">
          <h3 className="font-display" style={{ margin: "0 0 0.75rem", fontSize: "1.35rem" }}>
            Your projects
          </h3>
          {loading && <p className="muted">Loading…</p>}
          {error && <p style={{ color: "#8a2f2f" }}>{error}</p>}
          {!loading && data?.length === 0 && (
            <p className="muted">No projects yet.</p>
          )}
          {data?.map((project) => (
            <div key={project.id} className="list-row">
              <div>
                <Link href={`/vault/projects/${project.id}`}>
                  <strong>{project.name}</strong>
                </Link>
                <p className="muted" style={{ margin: "0.25rem 0 0", fontSize: "0.92rem" }}>
                  {project.description || "No description"}
                </p>
              </div>
              <button className="btn btn-ghost" onClick={() => void onDelete(project.id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
