import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <section className="hero-plane">
        <div className="hero-visual" aria-hidden="true" />
        <div className="shell hero-copy">
          <p className="fade-up brand-mark">IPCL</p>
          <h1 className="fade-up-delay">Stop explaining yourself.</h1>
          <p className="fade-up-delay-2">
            Your context follows you across AI.
          </p>
          <div className="hero-actions fade-up-delay-2">
            <Link href="/vault" className="btn btn-primary">
              Open your vault
            </Link>
            <Link href="/vault/preview" className="btn btn-ghost" style={{ color: "#f4faf7", borderColor: "rgba(244,250,247,0.35)" }}>
              Preview what gets shared
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell stack">
          <div>
            <p className="pill">Product principle</p>
            <h2>One memory. Every AI.</h2>
            <p className="muted" style={{ maxWidth: "40rem", lineHeight: 1.6 }}>
              AI providers generate answers. IPCL is the independent layer that
              holds who you are, what you decided, and what matters for the
              project—then shares only the relevant fragments with whichever
              AI you open next.
            </p>
          </div>

          <div className="grid-2">
            <div className="panel stack">
              <h3 className="font-display" style={{ margin: 0, fontSize: "1.5rem" }}>
                Connect → choose → continue
              </h3>
              <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>
                Start a new AI tool in seconds. Pull profile, project decisions,
                and matching knowledge through MCP, API, or copy/export—without
                re-teaching your stack and working style.
              </p>
            </div>
            <div className="panel stack">
              <h3 className="font-display" style={{ margin: 0, fontSize: "1.5rem" }}>
                Privacy by explicit share
              </h3>
              <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>
                Nothing leaves the vault until you connect or invoke an
                integration. Preview exactly what will be sent, where it is
                going, and remove context at item, project, or account level.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
