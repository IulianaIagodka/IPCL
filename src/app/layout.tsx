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
  title: "IPCL — Context Control Plane",
  description:
    "Web-first control plane for a portable AI context layer. Manage memory and permissions here; use context in the AI tools you already trust.",
};

const NAV = [
  { href: "/vault", label: "Home" },
  { href: "/vault/context", label: "Context" },
  { href: "/vault/projects", label: "Projects" },
  { href: "/vault/integrations", label: "Integrations" },
  { href: "/vault/activity", label: "Activity" },
  { href: "/vault/settings", label: "Settings" },
] as const;

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
              IPCL <span>Control Plane</span>
            </Link>
            <nav className="nav-links" aria-label="Control plane">
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
