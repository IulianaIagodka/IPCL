"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/client";
import type { Profile } from "@/lib/types";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [expertiseText, setExpertiseText] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api<Profile>("/api/profile")
      .then((p) => {
        setProfile(p);
        setExpertiseText(p.expertise.join(", "));
      })
      .catch((err) => setError(err.message));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!profile) return;
    setStatus(null);
    setError(null);
    try {
      const updated = await api<Profile>("/api/profile", {
        method: "PUT",
        body: JSON.stringify({
          displayName: profile.displayName,
          role: profile.role,
          expertise: expertiseText
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          communicationPreferences: profile.communicationPreferences,
          recurringInstructions: profile.recurringInstructions,
        }),
      });
      setProfile(updated);
      setExpertiseText(updated.expertise.join(", "));
      setStatus("Profile saved to the vault.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  if (!profile) {
    return (
      <div className="shell section">
        <p className="muted">{error || "Loading profile…"}</p>
      </div>
    );
  }

  return (
    <div className="shell section stack">
      <div>
        <p className="pill">Profile</p>
        <h2>Long-lived context about you</h2>
        <p className="muted">
          Role, expertise, communication style, and recurring instructions.
        </p>
      </div>

      <form className="panel stack" onSubmit={onSubmit}>
        <label>
          <span className="field-label">Display name</span>
          <input
            className="field"
            value={profile.displayName}
            onChange={(e) =>
              setProfile({ ...profile, displayName: e.target.value })
            }
          />
        </label>
        <label>
          <span className="field-label">Role</span>
          <input
            className="field"
            value={profile.role}
            onChange={(e) => setProfile({ ...profile, role: e.target.value })}
            placeholder="Product engineer, founder, designer…"
          />
        </label>
        <label>
          <span className="field-label">Expertise (comma separated)</span>
          <input
            className="field"
            value={expertiseText}
            onChange={(e) => setExpertiseText(e.target.value)}
            placeholder="TypeScript, MCP, payments…"
          />
        </label>
        <label>
          <span className="field-label">Communication preferences</span>
          <textarea
            className="field"
            rows={3}
            value={profile.communicationPreferences}
            onChange={(e) =>
              setProfile({
                ...profile,
                communicationPreferences: e.target.value,
              })
            }
            placeholder="Be direct. Prefer concrete examples over abstractions."
          />
        </label>
        <label>
          <span className="field-label">Recurring instructions</span>
          <textarea
            className="field"
            rows={4}
            value={profile.recurringInstructions}
            onChange={(e) =>
              setProfile({
                ...profile,
                recurringInstructions: e.target.value,
              })
            }
            placeholder="Avoid explaining basic software engineering concepts unless asked."
          />
        </label>
        <button className="btn btn-primary" type="submit">
          Save profile
        </button>
        {status && <p style={{ color: "var(--sea-deep)", margin: 0 }}>{status}</p>}
        {error && <p style={{ color: "#8a2f2f", margin: 0 }}>{error}</p>}
      </form>
    </div>
  );
}
