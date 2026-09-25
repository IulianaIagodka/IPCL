"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, useAsyncResource } from "@/lib/client";
import type { ControlPlaneStatus } from "@/lib/types";

const SETUP: Record<
  Exclude<ControlPlaneStatus["nextStep"], "ready" | "connect_integration">,
  { href: string; label: string; why: string }
> = {
  setup_account: {
    href: "/vault/login",
    label: "Create your account",
    why: "One owner for this vault — takes a minute.",
  },
  complete_profile: {
    href: "/vault/profile",
    label: "Add who you are",
    why: "Role and standing instructions, so AI stops asking again.",
  },
  create_project: {
    href: "/vault/projects",
    label: "Name your project",
    why: "Keeps decisions for this product separate from others.",
  },
};

export default function VaultHomePage() {
  const router = useRouter();
  const { data, error, loading, reload } = useAsyncResource(
    () => api<ControlPlaneStatus>("/api/control-plane"),
    []
  );

  useEffect(() => {
    if (!data) return;
    if (data.setupRequired || !data.authenticated) {
      router.replace("/vault/login");
    }
  }, [data, router]);

  const setupKey =
    data && data.nextStep !== "ready" && data.nextStep !== "connect_integration"
      ? data.nextStep
      : null;
  const setup = setupKey ? SETUP[setupKey] : null;
  const ready = data?.nextStep === "ready" || data?.nextStep === "connect_integration";

  return (
    <div className="shell section stack">
      <div className="fade-up">
        <p className="eyebrow">Eidothea</p>
        <h2 className="page-title">Two moves. Every day.</h2>
        <p className="lede" style={{ maxWidth: "36rem" }}>
          Save important decisions here. When you open Cursor or ChatGPT, copy
          the matching context out. This is not a chat — it is your memory.
        </p>
      </div>

      {loading && <p className="muted">Loading…</p>}
      {error && <p style={{ color: "#8a2f2f" }}>{error}</p>}

      {data?.authenticated && (
        <>
          {!ready && setup && (
            <div className="panel stack fade-up-delay">
              <p className="eyebrow">First-time setup</p>
              <h3 className="font-display" style={{ margin: 0, fontSize: "1.45rem" }}>
                {setup.label}
              </h3>
              <p className="muted" style={{ margin: 0, lineHeight: 1.5 }}>
                {setup.why}
              </p>
              <Link className="btn btn-primary" href={setup.href}>
                Continue
              </Link>
              <button className="btn btn-ghost" onClick={() => void reload()}>
                Refresh
              </button>
            </div>
          )}

          {ready && (
            <div className="grid-2 fade-up-delay">
              <div className="panel stack">
                <p className="eyebrow">1 · Save</p>
                <h3 className="font-display" style={{ margin: 0, fontSize: "1.45rem" }}>
                  Something new was decided?
                </h3>
                <p className="muted" style={{ margin: 0, lineHeight: 1.5 }}>
                  Paste a chat snippet or note. We keep the decision so you do
                  not re-explain it tomorrow.
                </p>
                <Link className="btn btn-primary" href="/vault/import">
                  Save from chat
                </Link>
              </div>

              <div className="panel stack">
                <p className="eyebrow">2 · Use</p>
                <h3 className="font-display" style={{ margin: 0, fontSize: "1.45rem" }}>
                  Opening Cursor or ChatGPT?
                </h3>
                <p className="muted" style={{ margin: 0, lineHeight: 1.5 }}>
                  Build a short context pack, copy it, paste at the top of the
                  chat. That is the whole daily loop.
                </p>
                <Link className="btn btn-primary" href="/vault/preview">
                  Use in AI
                </Link>
              </div>
            </div>
          )}

          <div className="panel stack fade-up-delay">
            <h3 className="font-display" style={{ margin: 0, fontSize: "1.2rem" }}>
              Status
            </h3>
            <ChecklistItem done={data.steps.account} label="Account" />
            <ChecklistItem done={data.steps.profile} label="Profile" />
            <ChecklistItem done={data.steps.project} label="Project" />
            <ChecklistItem
              done={data.steps.integration}
              label="MCP connect (optional)"
            />
            {data.stats && (
              <p className="muted" style={{ fontSize: "0.9rem", margin: "0.35rem 0 0" }}>
                {data.stats.projects} projects · {data.stats.decisions} decisions ·{" "}
                {data.stats.contextItems} saved fragments
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ChecklistItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="list-row" style={{ padding: "0.45rem 0" }}>
      <span>{label}</span>
      <strong style={{ color: done ? "var(--sea-deep)" : "var(--ink-soft)" }}>
        {done ? "Done" : "Later"}
      </strong>
    </div>
  );
}
