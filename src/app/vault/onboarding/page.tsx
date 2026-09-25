"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, useAsyncResource } from "@/lib/client";
import type { ControlPlaneStatus } from "@/lib/types";

const STEPS: Array<{
  key: keyof ControlPlaneStatus["steps"];
  title: string;
  body: string;
  href: string;
  cta: string;
}> = [
  {
    key: "account",
    title: "1. Authenticate",
    body: "Create the vault owner so the control plane has a trusted identity.",
    href: "/vault/login",
    cta: "Open login",
  },
  {
    key: "profile",
    title: "2. Profile",
    body: "Capture role, expertise, and recurring instructions once.",
    href: "/vault/profile",
    cta: "Edit profile",
  },
  {
    key: "project",
    title: "3. Project",
    body: "Add a project so retrieval and permissions can be scoped.",
    href: "/vault/projects",
    cta: "Add project",
  },
  {
    key: "integration",
    title: "4. Connect AI",
    body: "Issue an MCP token and return to Cursor/Claude—no first-party chat here.",
    href: "/vault/integrations",
    cta: "Connect MCP",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { data, loading, error, reload } = useAsyncResource(
    () => api<ControlPlaneStatus>("/api/control-plane"),
    []
  );

  useEffect(() => {
    if (data?.nextStep === "ready") {
      router.replace("/vault");
    }
  }, [data, router]);

  return (
    <div className="shell section stack">
      <div className="fade-up">
        <p className="pill">Onboarding</p>
        <h2>Configure once. Use everywhere.</h2>
        <p className="muted" style={{ maxWidth: "40rem", lineHeight: 1.55 }}>
          ADR-004 success path: open the web app → create or import context →
          connect an AI tool → return to that tool with relevant context
          available.
        </p>
      </div>

      {loading && <p className="muted">Checking status…</p>}
      {error && <p style={{ color: "#8a2f2f" }}>{error}</p>}

      {data && (
        <div className="stack fade-up-delay">
          {STEPS.map((step) => {
            const done = data.steps[step.key];
            return (
              <div key={step.key} className="panel stack">
                <div className="list-row" style={{ padding: 0 }}>
                  <h3 className="font-display" style={{ margin: 0, fontSize: "1.25rem" }}>
                    {step.title}
                  </h3>
                  <strong style={{ color: done ? "var(--sea-deep)" : undefined }}>
                    {done ? "Done" : "Todo"}
                  </strong>
                </div>
                <p className="muted" style={{ margin: 0, lineHeight: 1.5 }}>
                  {step.body}
                </p>
                {!done && (
                  <Link className="btn btn-primary" href={step.href}>
                    {step.cta}
                  </Link>
                )}
              </div>
            );
          })}
          <button className="btn btn-ghost" onClick={() => void reload()}>
            Refresh checklist
          </button>
          {data.nextStep === "ready" && (
            <Link className="btn btn-primary" href="/vault">
              Open control plane home
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
