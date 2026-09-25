"use client";

import Link from "next/link";
import { api, useAsyncResource } from "@/lib/client";
import { StateBadge } from "@/components/StateBadge";

type Stats = {
  hasProfile: boolean;
  projects: number;
  contextItems: number;
};

export default function SettingsPage() {
  const { data, error, loading, reload } = useAsyncResource(
    () => api<Stats>("/api/vault"),
    []
  );

  async function wipeVault() {
    if (
      !window.confirm(
        "Delete all local vault data? This cannot be undone on this device."
      )
    ) {
      return;
    }
    await api("/api/vault", { method: "DELETE" });
    await reload();
  }

  return (
    <div className="shell section stack">
      <div>
        <p className="eyebrow">Settings</p>
        <h2 className="page-title">Control</h2>
        <p className="muted">
          Profile, import, and local vault controls. Privacy stays legible.
        </p>
      </div>

      {loading && <p className="muted">Loading…</p>}
      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}

      <div className="grid-2">
        <div className="panel stack">
          <p className="eyebrow">Account context</p>
          <div className="list-row" style={{ padding: "0.55rem 0" }}>
            <span>Profile</span>
            <StateBadge
              state={data?.hasProfile ? "active" : "restricted"}
              label={data?.hasProfile ? "READY" : "INCOMPLETE"}
            />
          </div>
          <div className="list-row" style={{ padding: "0.55rem 0" }}>
            <span>Projects</span>
            <strong>{data?.projects ?? "—"}</strong>
          </div>
          <div className="list-row" style={{ padding: "0.55rem 0" }}>
            <span>Memories</span>
            <strong>{data?.contextItems ?? "—"}</strong>
          </div>
          <Link href="/vault/profile" className="btn btn-primary">
            Edit profile
          </Link>
          <Link href="/vault/import" className="btn btn-ghost">
            Import notes or conversations
          </Link>
        </div>

        <div className="panel stack">
          <p className="eyebrow">Danger zone</p>
          <p className="muted" style={{ margin: 0, lineHeight: 1.5 }}>
            Local SQLite vault only. Wiping clears profile, projects, memories,
            and search index on this machine.
          </p>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ borderColor: "rgba(231, 124, 124, 0.45)", color: "var(--danger)" }}
            onClick={() => void wipeVault()}
          >
            Wipe local vault
          </button>
        </div>
      </div>
    </div>
  );
}
