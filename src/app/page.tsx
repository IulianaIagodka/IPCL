import Link from "next/link";
import { ContextFlow } from "@/components/ContextFlow";

export default function HomePage() {
  return (
    <>
      <section className="hero-plane">
        <div className="hero-visual" aria-hidden="true" />
        <div className="shell hero-copy">
          <h1 className="fade-up brand-hero">Eidothea</h1>
          <p className="fade-up-delay hero-slogan">
            Stop explaining yourself.
          </p>
          <div className="hero-actions fade-up-delay-2">
            <Link href="/vault" className="btn btn-primary">
              Open your vault
            </Link>
            <Link href="/vault/preview" className="btn btn-ghost">
              Preview what gets shared
            </Link>
          </div>
          <div className="fade-up-delay-2">
            <ContextFlow
              from="Memory"
              to="Any AI"
              label="Controlled transfer — not AI magic"
              compact
            />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell stack">
          <div>
            <p className="eyebrow">Product principle</p>
            <h2>One memory. Every AI.</h2>
            <p className="muted" style={{ maxWidth: "40rem", lineHeight: 1.6 }}>
              Your context follows you across AI. Eidothea is the calm control
              plane for personal context — inspectable memories, scoped access,
              and explicit share with whichever AI you open next.
            </p>
          </div>

          <div className="grid-2">
            <div className="panel stack">
              <p className="eyebrow">Memory → Scope → Permission</p>
              <h3 style={{ margin: 0, fontSize: "1.25rem", letterSpacing: "-0.02em" }}>
                See what your AI knows
              </h3>
              <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>
                Browse memories by scope, trace sources, and restrict what each
                connected tool can reach — without turning the vault into a
                document manager.
              </p>
            </div>
            <div className="panel stack">
              <p className="eyebrow">Who can see what?</p>
              <h3 style={{ margin: 0, fontSize: "1.25rem", letterSpacing: "-0.02em" }}>
                Access is a matrix, not a mystery
              </h3>
              <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>
                Integrations show permission state at a glance. Activity logs
                every share preview so trust comes from visibility, not slogans.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
