import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import Link from "next/link";
import { BrandMark } from "@/components/ContextFlow";
import "./globals.css";

export const metadata: Metadata = {
  title: "IPCL — Context Vault",
  description:
    "Stop explaining yourself. Your context follows you across AI. One memory. Every AI.",
};

const NAV = [
  { href: "/vault", label: "Home" },
  { href: "/vault/context", label: "Context" },
  { href: "/vault/projects", label: "Projects" },
  { href: "/vault/integrations", label: "Integrations" },
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
                IPCL
                <small>Context Vault</small>
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
      </body>
    </html>
  );
}
