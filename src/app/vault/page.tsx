"use client";

import Link from "next/link";
import { useAsyncResource, api } from "@/lib/client";

type Stats = {
  projects: number;
  preferences: number;
  decisions: number;
  sources: number;
  contextItems: number;
  hasProfile: boolean;
};

export default function VaultPage() {
  const { data, error, loading, reload } = useAsyncResource(
    () => api<Stats>("/api/vault"),
    []
  );

  return (
    <div className="shell section stack">
      <div className="fade-up">
        <p className="pill">Memora</p>
        <h2>One memory. Every AI.</h2>
        <p className="muted" style={{ maxWidth: "38rem", lineHeight: 1.55 }}>
          Your context follows you across AI. Maintain it once, retrieve only
          what is relevant, and share only when you choose.
        </p>
      </div>

      {loading && <p className="muted">Loading vault…</p>}
      {error && <p style={{ color: "#8a2f2f" }}>{error}</p>}

      {data && (
        <div className="grid-2 fade-up-delay">
          <div className="panel stack">
            <h3 className="font-display" style={{ margin: 0, fontSize: "1.45rem" }}>
              Vault snapshot
            </h3>
            <div className="stack" style={{ gap: "0.35rem" }}>
              <Stat label="Profile ready" value={data.hasProfile ? "Yes" : "Not yet"} />
              <Stat label="Projects" value={String(data.projects)} />
              <Stat label="Preferences" value={String(data.preferences)} />
              <Stat label="Decisions" value={String(data.decisions)} />
              <Stat label="Sources" value={String(data.sources)} />
              <Stat label="Searchable fragments" value={String(data.contextItems)} />
            </div>
            <button className="btn btn-ghost" onClick={() => void reload()}>
              Refresh
            </button>
          </div>

          <div className="panel stack">
            <h3 className="font-display" style={{ margin: 0, fontSize: "1.45rem" }}>
              Continue where you left off
            </h3>
            <div className="stack">
              <Link className="btn btn-primary" href="/vault/profile">
                Edit profile
              </Link>
              <Link className="btn btn-ghost" href="/vault/projects">
                Manage projects
              </Link>
              <Link className="btn btn-ghost" href="/vault/import">
                Import notes or conversations
              </Link>
              <Link className="btn btn-ghost" href="/vault/search">
                Search relevant context
              </Link>
              <Link className="btn btn-ghost" href="/vault/preview">
                Preview & export
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="list-row" style={{ padding: "0.55rem 0" }}>
      <span className="muted">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
