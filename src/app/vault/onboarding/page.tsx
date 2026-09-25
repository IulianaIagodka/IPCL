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
  optional?: boolean;
}> = [
  {
    key: "account",
    title: "1. Account",
    body: "Sign in so only you can open this vault.",
    href: "/vault/login",
    cta: "Open login",
  },
  {
    key: "profile",
    title: "2. Profile",
    body: "Who you are and standing instructions.",
    href: "/vault/profile",
    cta: "Edit profile",
  },
  {
    key: "project",
    title: "3. Project",
    body: "One named space for this product’s decisions.",
    href: "/vault/projects",
    cta: "Add project",
  },
  {
    key: "integration",
    title: "4. MCP (optional)",
    body: "Skip for now. Use “Use in AI” to copy context into Cursor.",
    href: "/vault/preview",
    cta: "Use in AI instead",
    optional: true,
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
        <p className="pill">Setup</p>
        <h2>Three required steps</h2>
        <p className="muted" style={{ maxWidth: "40rem", lineHeight: 1.55 }}>
          Account → profile → project. Then use Save and Use in AI every day.
          MCP is optional.
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
                    {done ? "Done" : step.optional ? "Optional" : "Todo"}
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
            Refresh
          </button>
          {data.nextStep === "ready" && (
            <Link className="btn btn-primary" href="/vault">
              Go to home
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
