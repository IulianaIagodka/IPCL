import type { Metadata } from "next";
import { LegalDoc } from "@/components/LegalDoc";

export const metadata: Metadata = {
  title: "Copyright — Eidothea",
  description:
    "Copyright and intellectual property notice for Eidothea and eidothea.app.",
  alternates: { canonical: "/copyright" },
};

export default function CopyrightPage() {
  return (
    <LegalDoc eyebrow="Legal" title="Copyright" updated="September 25, 2026">
      <p>
        © {new Date().getFullYear()} Iuliana Iagodka. All rights reserved.
      </p>
      <p>
        <strong>Eidothea</strong>, the Eidothea name and mark, the product UI,
        documentation, and the software that powers{" "}
        <a href="https://eidothea.app">eidothea.app</a> are protected by
        copyright and other applicable intellectual property laws.
      </p>

      <h2>What this covers</h2>
      <ul>
        <li>Product brand name, slogans, and visual identity</li>
        <li>Application source code, APIs, and control-plane UI</li>
        <li>Architecture decision records and product documentation</li>
        <li>Copy, graphics, and layout published on this site</li>
      </ul>

      <h2>Your vault content</h2>
      <p>
        You retain rights to the personal and project context you store in your
        vault—notes, decisions, imports, and similar material you supply.
        Eidothea processes that content only to provide the service under the{" "}
        <a href="/privacy">Privacy</a> policy and the permissions you configure.
      </p>

      <h2>Limited permission</h2>
      <p>
        You may view and use the public site and, if authorized, operate a vault
        for its intended purpose. No license is granted to copy, modify,
        redistribute, reverse engineer, or commercially exploit Eidothea
        software, branding, or documentation except as allowed by a separate
        written agreement or an applicable open-source license notice in the
        repository.
      </p>

      <h2>Third-party marks</h2>
      <p>
        Names of AI products and platforms mentioned on this site (for example
        ChatGPT, Claude, Cursor, Codex, Gemini) are trademarks of their
        respective owners. Mention does not imply affiliation or endorsement.
      </p>

      <h2>Notices</h2>
      <p>
        To report copyright concerns or request permission, contact{" "}
        <a href="mailto:iuliana.iagodka@gmail.com">iuliana.iagodka@gmail.com</a>
        .
      </p>
    </LegalDoc>
  );
}
