"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";

type AuthState = {
  authenticated: boolean;
  setupRequired: boolean;
  user: { id: string; email: string; displayName: string } | null;
};

export default function LoginPage() {
  const router = useRouter();
  const [state, setState] = useState<AuthState | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch("/api/auth", { credentials: "include" })
      .then((r) => r.json())
      .then((data: AuthState) => {
        setState(data);
        if (data.authenticated) router.replace("/vault");
      });
  }, [router]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const action = state?.setupRequired ? "setup" : "login";
      await api("/api/auth", {
        method: "POST",
        body: JSON.stringify({ action, email, password, displayName }),
      });
      router.replace("/vault/security");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setBusy(false);
    }
  }

  if (!state) {
    return (
      <div className="shell section">
        <p className="muted">Checking vault access…</p>
      </div>
    );
  }

  return (
    <div className="shell section stack" style={{ maxWidth: "32rem" }}>
      <div>
        <p className="pill">Security</p>
        <h2>{state.setupRequired ? "Create vault owner" : "Sign in"}</h2>
        <p className="muted">
          {state.setupRequired
            ? "ADR-003: authenticate before any context access. This local owner owns the tenant."
            : "Session cookies are HttpOnly and short-lived relative to offline vault use."}
        </p>
      </div>

      <form className="panel stack" onSubmit={onSubmit}>
        {state.setupRequired && (
          <label>
            <span className="field-label">Display name</span>
            <input
              className="field"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </label>
        )}
        <label>
          <span className="field-label">Email</span>
          <input
            className="field"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />
        </label>
        <label>
          <span className="field-label">Password</span>
          <input
            className="field"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={state.setupRequired ? "new-password" : "current-password"}
          />
        </label>
        {error && <p style={{ color: "#8a2f2f" }}>{error}</p>}
        <button className="btn btn-primary" disabled={busy} type="submit">
          {busy ? "Working…" : state.setupRequired ? "Create owner" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
