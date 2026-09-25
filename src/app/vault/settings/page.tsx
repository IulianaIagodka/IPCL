"use client";

import Link from "next/link";
import { api } from "@/lib/client";

export default function SettingsPage() {
  async function logout() {
    await api("/api/auth", {
      method: "POST",
      body: JSON.stringify({ action: "logout" }),
    });
    window.location.href = "/vault/login";
  }

  async function deleteAccount() {
    if (
      !confirm(
        "Delete this vault owner and all associated memories, sources, and integrations?"
      )
    ) {
      return;
    }
    await api("/api/auth", {
      method: "POST",
      body: JSON.stringify({ action: "delete_account" }),
    });
    window.location.href = "/vault/login";
  }

  return (
    <div className="shell section stack">
      <div className="fade-up">
        <p className="pill">Settings</p>
        <h2>Account & privacy</h2>
        <p className="muted" style={{ maxWidth: "40rem", lineHeight: 1.55 }}>
          The control plane owns account lifecycle. Context, permissions, and
          audit trail live in the Context Service—not in any AI provider.
        </p>
      </div>

      <div className="panel stack fade-up-delay">
        <h3 className="font-display" style={{ margin: 0, fontSize: "1.35rem" }}>
          Privacy controls
        </h3>
        <Link className="btn btn-ghost" href="/vault/preview">
          Preview & manual export
        </Link>
        <Link className="btn btn-ghost" href="/vault/integrations">
          Manage integration permissions
        </Link>
        <Link className="btn btn-ghost" href="/vault/activity">
          Review activity
        </Link>
        <Link className="btn btn-ghost" href="/vault/profile">
          Edit profile
        </Link>
        <Link className="btn btn-ghost" href="/privacy">
          Privacy policy
        </Link>
        <Link className="btn btn-ghost" href="/copyright">
          Copyright
        </Link>
      </div>

      <div className="panel stack">
        <h3 className="font-display" style={{ margin: 0, fontSize: "1.35rem" }}>
          Session
        </h3>
        <button className="btn btn-ghost" onClick={() => void logout()}>
          Sign out
        </button>
        <button className="btn btn-ghost" onClick={() => void deleteAccount()}>
          Delete account & wipe vault
        </button>
      </div>
    </div>
  );
}
