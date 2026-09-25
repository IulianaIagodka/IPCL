import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import Link from "next/link";
import { BrandMark } from "@/components/ContextFlow";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://eidothea.app"),
  title: "Eidothea — Stop explaining yourself.",
  description:
    "Eidothea. Stop explaining yourself. One memory. Every AI.",
  alternates: {
    canonical: "/",
  },
};

const NAV = [
  { href: "/vault", label: "Home" },
  { href: "/vault/context", label: "Context" },
  { href: "/vault/projects", label: "Projects" },
  { href: "/vault/integrations", label: "Integrations" },
  { href: "/vault/security", label: "Security" },
  { href: "/vault/activity", label: "Activity" },
  { href: "/vault/settings", label: "Settings" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body
        style={
          {
            ["--font-body" as string]: "var(--font-geist-sans)",
            ["--font-mono" as string]: "var(--font-geist-mono)",
          } as React.CSSProperties
        }
      >
        <header className="site-header">
          <div className="shell site-header-inner">
            <Link href="/" className="brand">
              <BrandMark />
              <span className="brand-text">
                Eidothea
                <small>One memory. Every AI</small>
              </span>
            </Link>
            <nav className="nav-links" aria-label="Primary">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div className="shell site-footer-inner">
            <p className="site-footer-brand">
              © {new Date().getFullYear()} Eidothea
            </p>
            <nav className="site-footer-links" aria-label="Legal">
              <Link href="/privacy">Privacy</Link>
              <Link href="/copyright">Copyright</Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
