import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Memora — One memory. Every AI.",
  description:
    "Stop explaining yourself. Your context follows you across AI. One memory. Every AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${manrope.variable}`}>
      <body
        style={
          {
            ["--font-display" as string]: "var(--font-fraunces)",
            ["--font-body" as string]: "var(--font-manrope)",
          } as React.CSSProperties
        }
      >
        <header className="site-header">
          <div className="shell site-header-inner">
            <Link href="/" className="brand">
              Memora
            </Link>
            <nav className="nav-links">
              <Link href="/vault">Vault</Link>
              <Link href="/vault/profile">Profile</Link>
              <Link href="/vault/projects">Projects</Link>
              <Link href="/vault/import">Import</Link>
              <Link href="/vault/search">Search</Link>
              <Link href="/vault/preview">Preview</Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
