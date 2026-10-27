import type { ReactNode } from 'react';
import Link from 'next/link';
import LegalLinks from './LegalLinks';

interface LegalDocumentLayoutProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  children: ReactNode;
}

/**
 * Shell compartido para páginas legales (privacidad / términos).
 *
 * Permite scroll aunque el layout raíz use `overflow-hidden`.
 */
export default function LegalDocumentLayout({
  title,
  subtitle,
  lastUpdated,
  children,
}: LegalDocumentLayoutProps) {
  return (
    <div className="h-screen w-full overflow-y-auto bg-surface-bright text-on-surface">
      <main className="mx-auto max-w-3xl px-4 py-10 md:px-8 md:py-14">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary-container"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Volver a TaskFlow
          </Link>
          <LegalLinks />
        </div>

        <header className="mb-8 space-y-3 border-b border-outline-variant pb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            TaskFlow
          </p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
          <p className="text-sm text-on-surface-variant md:text-base">{subtitle}</p>
          <p className="text-xs text-outline">Última actualización: {lastUpdated}</p>
        </header>

        <article className="space-y-8 text-sm leading-relaxed text-on-surface md:text-[15px]">
          {children}
        </article>

        <footer className="mt-12 border-t border-outline-variant pt-6 pb-8">
          <LegalLinks />
        </footer>
      </main>
    </div>
  );
}
