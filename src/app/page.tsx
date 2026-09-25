import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <section className="hero-plane">
        <div className="hero-visual" aria-hidden="true" />
        <div className="shell hero-copy">
          <p
            className="fade-up"
            style={{
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              fontSize: "0.78rem",
              fontWeight: 700,
              marginBottom: "0.4rem",
            }}
          >
            IPCL
          </p>
          <h1 className="fade-up-delay">Stop explaining yourself to AI.</h1>
          <p className="fade-up-delay-2">
            A web control plane for portable context—configure memory once,
            then keep working in Cursor, Claude, ChatGPT, and the rest.
          </p>
          <div className="hero-actions fade-up-delay-2">
            <Link href="/vault/onboarding" className="btn btn-primary">
              Open control plane
            </Link>
            <Link
              href="/vault/integrations"
              className="btn btn-ghost"
              style={{ color: "#f4faf7", borderColor: "rgba(244,250,247,0.35)" }}
            >
              Connect via MCP
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell stack">
          <div>
            <p className="pill">ADR-004 architecture</p>
            <h2>Manage here. Work in your AI tools.</h2>
            <p className="muted" style={{ maxWidth: "42rem", lineHeight: 1.6 }}>
              The web app is not a chat product. It is the management surface
              over a Context Service that owns memory, retrieval, permissions,
              and audit. MCP and the Product API are access layers—never a
              second source of truth.
            </p>
          </div>

          <div className="grid-2">
            <div className="panel stack">
              <h3 className="font-display" style={{ margin: 0, fontSize: "1.5rem" }}>
                Control plane
              </h3>
              <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>
                Onboarding, profile, projects, memory inspection, integration
                permissions, activity, and export—all in the browser, across
                operating systems.
              </p>
            </div>
            <div className="panel stack">
              <h3 className="font-display" style={{ margin: 0, fontSize: "1.5rem" }}>
                Integration layer
              </h3>
              <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>
                Primary path: MCP into Cursor or Claude. Fallback: Product API,
                preview, and copy/export. Same authorization rules on every
                transport.
              </p>
            </div>
          </div>

          <ol className="panel stack" style={{ margin: 0, paddingLeft: "1.25rem" }}>
            <li>Open the web app</li>
            <li>Create or import context</li>
            <li>Connect an AI tool</li>
            <li>Return to that AI tool with relevant context available</li>
          </ol>
        </div>
      </section>
    </>
  );
}
