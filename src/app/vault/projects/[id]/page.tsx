"use client";

import { FormEvent, use, useEffect, useState } from "react";
import { api } from "@/lib/client";
import type { Decision, Preference, Project } from "@/lib/types";

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [decisionText, setDecisionText] = useState("");
  const [preferenceText, setPreferenceText] = useState("");
  const [stackText, setStackText] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [p, d, prefs] = await Promise.all([
      api<Project>(`/api/projects/${id}`),
      api<Decision[]>(`/api/decisions?projectId=${id}`),
      api<Preference[]>("/api/preferences"),
    ]);
    setProject(p);
    setStackText(p.technologyStack.join(", "));
    setDecisions(d);
    setPreferences(prefs);
  }

  useEffect(() => {
    void load().catch((err) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function saveProject(event: FormEvent) {
    event.preventDefault();
    if (!project) return;
    setStatus(null);
    try {
      const updated = await api<Project>(`/api/projects/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...project,
          technologyStack: stackText
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      setProject(updated);
      setStatus("Project updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function addDecision(event: FormEvent) {
    event.preventDefault();
    await api("/api/decisions", {
      method: "POST",
      body: JSON.stringify({ projectId: id, content: decisionText }),
    });
    setDecisionText("");
    await load();
  }

  async function addPreference(event: FormEvent) {
    event.preventDefault();
    await api("/api/preferences", {
      method: "POST",
      body: JSON.stringify({ content: preferenceText }),
    });
    setPreferenceText("");
    await load();
  }

  if (!project) {
    return (
      <div className="shell section">
        <p className="muted">{error || "Loading project…"}</p>
      </div>
    );
  }

  return (
    <div className="shell section stack">
      <div>
        <p className="pill">Project</p>
        <h2>{project.name}</h2>
        <p className="muted">Decisions here should not be reopened by AI clients.</p>
      </div>

      <form className="panel stack" onSubmit={saveProject}>
        <label>
          <span className="field-label">Name</span>
          <input
            className="field"
            value={project.name}
            onChange={(e) => setProject({ ...project, name: e.target.value })}
          />
        </label>
        <label>
          <span className="field-label">Description</span>
          <textarea
            className="field"
            rows={3}
            value={project.description}
            onChange={(e) =>
              setProject({ ...project, description: e.target.value })
            }
          />
        </label>
        <label>
          <span className="field-label">Technology stack</span>
          <input
            className="field"
            value={stackText}
            onChange={(e) => setStackText(e.target.value)}
          />
        </label>
        <label>
          <span className="field-label">Target users</span>
          <input
            className="field"
            value={project.targetUsers}
            onChange={(e) =>
              setProject({ ...project, targetUsers: e.target.value })
            }
          />
        </label>
        <label>
          <span className="field-label">Architecture</span>
          <textarea
            className="field"
            rows={3}
            value={project.architecture}
            onChange={(e) =>
              setProject({ ...project, architecture: e.target.value })
            }
          />
        </label>
        <label>
          <span className="field-label">Constraints</span>
          <textarea
            className="field"
            rows={3}
            value={project.constraints}
            onChange={(e) =>
              setProject({ ...project, constraints: e.target.value })
            }
          />
        </label>
        <button className="btn btn-primary" type="submit">
          Save project
        </button>
        {status && <p style={{ color: "var(--sea-deep)", margin: 0 }}>{status}</p>}
      </form>

      <div className="grid-2">
        <form className="panel stack" onSubmit={addDecision}>
          <h3 className="font-display" style={{ margin: 0, fontSize: "1.3rem" }}>
            Add decision
          </h3>
          <textarea
            className="field"
            rows={3}
            value={decisionText}
            onChange={(e) => setDecisionText(e.target.value)}
            placeholder="Paypace uses monthly and yearly subscriptions."
            required
          />
          <button className="btn btn-primary" type="submit">
            Save decision
          </button>
          <div>
            {decisions.map((d) => (
              <div key={d.id} className="list-row">
                <span>{d.content}</span>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() =>
                    void api(`/api/decisions?id=${d.id}`, {
                      method: "DELETE",
                    }).then(load)
                  }
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </form>

        <form className="panel stack" onSubmit={addPreference}>
          <h3 className="font-display" style={{ margin: 0, fontSize: "1.3rem" }}>
            Add preference
          </h3>
          <textarea
            className="field"
            rows={3}
            value={preferenceText}
            onChange={(e) => setPreferenceText(e.target.value)}
            placeholder="Avoid explaining basic software engineering concepts unless asked."
            required
          />
          <button className="btn btn-primary" type="submit">
            Save preference
          </button>
          <div>
            {preferences.map((p) => (
              <div key={p.id} className="list-row">
                <span>{p.content}</span>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() =>
                    void api(`/api/preferences?id=${p.id}`, {
                      method: "DELETE",
                    }).then(load)
                  }
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </form>
      </div>
    </div>
  );
}
