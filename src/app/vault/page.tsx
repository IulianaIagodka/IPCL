"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, useAsyncResource } from "@/lib/client";
import type { ControlPlaneStatus } from "@/lib/types";

const STEP_LINKS: Record<
  ControlPlaneStatus["nextStep"],
  { href: string; label: string; hint: string }
> = {
  setup_account: {
    href: "/vault/login",
    label: "Create vault owner",
    hint: "Authenticate the control plane before any AI can connect.",
  },
  complete_profile: {
    href: "/vault/profile",
    label: "Set up profile",
    hint: "Who you are, how you work, and recurring instructions.",
  },
  create_project: {
    href: "/vault/projects",
    label: "Create a project",
    hint: "Scope memory to the work you actually do.",
  },
  connect_integration: {
    href: "/vault/integrations",
    label: "Connect an AI tool",
    hint: "Issue an MCP token so Cursor, Claude, or others can retrieve context.",
  },
  ready: {
    href: "/vault/context",
    label: "Inspect context",
    hint: "Your control plane is ready. Keep managing memory here; work in your AI tools.",
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

  const next = data ? STEP_LINKS[data.nextStep] : null;

  return (
    <div className="shell section stack">
      <div className="fade-up">
        <p className="eyebrow">Eidothea</p>
        <h2 className="page-title">Manage context. Use AI elsewhere.</h2>
        <p className="lede" style={{ maxWidth: "40rem" }}>
          This web app is the management surface for your portable context
          layer—not a chat product. Configure memory and permissions here;
          experience the value inside Cursor, Claude, ChatGPT, and friends.
        </p>
      </div>

      {loading && <p className="muted">Loading control plane…</p>}
      {error && <p style={{ color: "#8a2f2f" }}>{error}</p>}

      {data?.authenticated && (
        <>
          <div className="grid-2 fade-up-delay">
            <div className="panel stack">
              <h3 className="font-display" style={{ margin: 0, fontSize: "1.45rem" }}>
                {data.nextStep === "ready" ? "Ready" : "Next step"}
              </h3>
              <p className="muted" style={{ margin: 0, lineHeight: 1.5 }}>
                {next?.hint}
              </p>
              {next && (
                <Link className="btn btn-primary" href={next.href}>
                  {next.label}
                </Link>
              )}
              <button className="btn btn-ghost" onClick={() => void reload()}>
                Refresh status
              </button>
            </div>

            <div className="panel stack">
              <h3 className="font-display" style={{ margin: 0, fontSize: "1.45rem" }}>
                Setup checklist
              </h3>
              <ChecklistItem done={data.steps.account} label="Owner account" />
              <ChecklistItem done={data.steps.profile} label="Profile" />
              <ChecklistItem done={data.steps.project} label="At least one project" />
              <ChecklistItem
                done={data.steps.integration}
                label="Connected AI integration"
              />
              {data.stats && (
                <div className="muted" style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>
                  {data.stats.projects} projects · {data.stats.decisions} decisions ·{" "}
                  {data.stats.contextItems} fragments
                </div>
              )}
            </div>
          </div>

          <div className="panel stack fade-up-delay">
            <h3 className="font-display" style={{ margin: 0, fontSize: "1.35rem" }}>
              Control-plane surfaces
            </h3>
            <div className="stack" style={{ gap: "0.45rem" }}>
              <Link className="btn btn-ghost" href="/vault/context">
                Context — inspect & search memory
              </Link>
              <Link className="btn btn-ghost" href="/vault/projects">
                Projects — scoped work context
              </Link>
              <Link className="btn btn-ghost" href="/vault/integrations">
                Integrations — MCP permissions & tokens
              </Link>
              <Link className="btn btn-ghost" href="/vault/activity">
                Activity — what was accessed or shared
              </Link>
              <Link className="btn btn-ghost" href="/vault/preview">
                Export — manual fallback when MCP is unavailable
              </Link>
              <Link className="btn btn-ghost" href="/vault/settings">
                Settings — account & privacy
              </Link>
            </div>
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
        {done ? "Done" : "Pending"}
      </strong>
    </div>
  );
}
