import type { Metadata } from "next";
import { LegalDoc } from "@/components/LegalDoc";

export const metadata: Metadata = {
  title: "Privacy — Eidothea",
  description:
    "How Eidothea collects, stores, shares, and deletes your portable AI context.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalDoc eyebrow="Legal" title="Privacy" updated="September 25, 2026">
      <p>
        Eidothea is a portable context layer for AI. You keep profile, projects,
        decisions, preferences, and knowledge in one vault, then make only the
        fragments you authorize available to tools such as ChatGPT, Claude,
        Cursor, Codex, Gemini, or other MCP-compatible clients.
      </p>
      <p>
        This policy explains what we store, how sharing works, and what control
        you keep. It reflects the product security model: default deny, least
        privilege, and no silent export of your memory.
      </p>

      <h2>What we store</h2>
      <p>When you use Eidothea, the vault may hold:</p>
      <ul>
        <li>Account credentials for vault access (hashed, not shared with AI)</li>
        <li>Profile details and preferences you enter</li>
        <li>Projects, decisions, notes, and imported sources</li>
        <li>Integration configuration and permission scopes</li>
        <li>Activity and audit records of access and share previews</li>
        <li>Session cookies needed to keep you signed in</li>
      </ul>
      <p>
        We do not sell personal data. Context exists so you can reuse it across
        AI tools under rules you set.
      </p>

      <h2>How access works</h2>
      <p>
        No external AI receives context unless that specific request is
        authorized for that scope and data class. Integrations default to
        read-only. Restricted content is excluded from normal search, MCP
        retrieval, and export unless you use a dedicated path.
      </p>
      <p>
        Before sharing, you can preview what would leave the vault. Writes from
        integrations become candidate memories until you approve them.
      </p>

      <h2>Security measures</h2>
      <ul>
        <li>Authenticated vault owner sessions</li>
        <li>Tenant isolation by owner</li>
        <li>Encrypted transport in production (HTTPS and secure cookies)</li>
        <li>
          Application-level encryption at rest for secrets and restricted
          content
        </li>
        <li>Per-integration permissions and project scopes</li>
        <li>Sanitized logging and an auditable access trail</li>
        <li>Integration revoke and credential rotation</li>
      </ul>

      <h2>Sharing with external AI</h2>
      <p>
        When you connect an integration or export context, selected fragments
        may leave Eidothea and enter that provider&apos;s systems. After
        transmission, retention and deletion follow that provider&apos;s
        policies. Eidothea cannot guarantee removal from an external service
        once data has already been sent.
      </p>

      <h2>Your controls</h2>
      <ul>
        <li>Inspect memories, sources, and scopes in the vault</li>
        <li>Change or revoke integration permissions</li>
        <li>Preview and manually export context</li>
        <li>Review activity logs</li>
        <li>Sign out of the current session</li>
        <li>Delete the account and wipe vault data from the product</li>
      </ul>
      <p>
        Account deletion removes associated memories, sources, and integrations
        from the product. Backups may retain data briefly under operational
        retention, but deleted data must not remain accessible through
        Eidothea.
      </p>

      <h2>Cookies and local state</h2>
      <p>
        Eidothea uses session cookies for authentication. We do not use
        third-party advertising trackers on the product UI. Essential
        operational logs may record request metadata needed to secure the
        service.
      </p>

      <h2>Children</h2>
      <p>
        Eidothea is not directed at children under 16. Do not create a vault
        with personal information of a child if you are not authorized to do
        so.
      </p>

      <h2>Changes</h2>
      <p>
        We may update this policy as the product evolves. Material changes will
        be reflected on this page with a revised &ldquo;Last updated&rdquo;
        date.
      </p>

      <h2>Contact</h2>
      <p>
        Privacy questions:{" "}
        <a href="mailto:iuliana.iagodka@gmail.com">iuliana.iagodka@gmail.com</a>
        . Product site:{" "}
        <a href="https://eidothea.app">eidothea.app</a>.
      </p>
    </LegalDoc>
  );
}
