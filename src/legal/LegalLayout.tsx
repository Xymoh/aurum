import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { LegalLinks } from "./LegalLinks";
import { EFFECTIVE_DATE, SITE_NAME } from "./site";

interface LegalLayoutProps {
  title: string;
  children: ReactNode;
}

/**
 * Neutral chrome for the site-wide legal pages.
 *
 * These pages belong to the site as a whole, not to any one game, so they
 * use the same plain ground as the game picker rather than borrowing the
 * Genshin, Star Rail or Zenless identity.
 */
export function LegalLayout({ title, children }: LegalLayoutProps) {
  useDocumentTitle(`${title} - ${SITE_NAME}`);

  return (
    <div className="flex min-h-screen flex-col bg-dark-bg text-dark-text">
      <header className="border-b border-dark-border">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="text-sm font-semibold uppercase tracking-[0.2em] no-underline">
            {SITE_NAME}
          </Link>
          <ThemeToggle className="text-dark-muted hover:bg-dark-border/40 hover:text-dark-text" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-dark-muted">Effective {EFFECTIVE_DATE}</p>
        <div className="legal-prose mt-8">{children}</div>
      </main>

      <footer className="border-t border-dark-border py-6 text-center text-sm text-dark-muted">
        <LegalLinks className="text-accent underline hover:opacity-80" />
      </footer>
    </div>
  );
}

/** A titled block of the page, numbered so the sections can be referred to. */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-dark-text/90">{children}</div>
    </section>
  );
}

/** External link with the safe defaults every outbound link on the site uses. */
export function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent underline hover:opacity-80">
      {children}
    </a>
  );
}
