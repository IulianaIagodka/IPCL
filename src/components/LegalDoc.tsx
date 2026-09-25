import Link from "next/link";
import type { ReactNode } from "react";

type LegalDocProps = {
  eyebrow: string;
  title: string;
  updated: string;
  children: ReactNode;
};

export function LegalDoc({ eyebrow, title, updated, children }: LegalDocProps) {
  return (
    <article className="shell section legal-doc fade-up">
      <header className="legal-doc-header">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="page-title">{title}</h1>
        <p className="muted legal-doc-meta">Last updated {updated}</p>
      </header>
      <div className="legal-doc-body">{children}</div>
      <nav className="legal-doc-nav" aria-label="Legal">
        <Link href="/privacy">Privacy</Link>
        <Link href="/copyright">Copyright</Link>
        <Link href="/">Home</Link>
      </nav>
    </article>
  );
}
