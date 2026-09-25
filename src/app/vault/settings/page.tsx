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
        <p className="pill">More</p>
        <h2>Everything else</h2>
        <p className="muted" style={{ maxWidth: "36rem", lineHeight: 1.55 }}>
          Daily work lives in Save and Use in AI. These links are for setup and
          rare tasks.
        </p>
      </div>

      <div className="panel stack fade-up-delay">
        <h3 className="font-display" style={{ margin: 0, fontSize: "1.25rem" }}>
          Setup
        </h3>
        <Link className="btn btn-ghost" href="/vault/profile">
          Profile — who you are
        </Link>
        <Link className="btn btn-ghost" href="/vault/projects">
          Projects — name your work
        </Link>
        <Link className="btn btn-ghost" href="/vault/onboarding">
          Setup checklist
        </Link>
      </div>

      <div className="panel stack">
        <h3 className="font-display" style={{ margin: 0, fontSize: "1.25rem" }}>
          Advanced
        </h3>
        <Link className="btn btn-ghost" href="/vault/integrations">
          MCP connect (optional)
        </Link>
        <Link className="btn btn-ghost" href="/vault/activity">
          Activity log
        </Link>
      </div>

      <div className="panel stack">
        <h3 className="font-display" style={{ margin: 0, fontSize: "1.25rem" }}>
          Account
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
