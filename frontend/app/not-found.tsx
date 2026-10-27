import Link from 'next/link';
import LegalLinks from '@/components/layout/LegalLinks';

/**
 * Página 404 de TaskFlow.
 *
 * Se muestra cuando la ruta no existe en el App Router de Next.js.
 */
export default function NotFound() {
  return (
    <div className="flex h-screen w-full items-center justify-center overflow-y-auto bg-surface-bright px-4 py-10 text-on-surface">
      <section className="w-full max-w-lg rounded-[28px] border border-outline-variant bg-white p-6 text-center shadow-sm md:p-10 space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-low px-3 py-1 text-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px] text-primary">
            explore_off
          </span>
          Error 404
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Página no encontrada
          </h1>
          <p className="text-sm text-on-surface-variant md:text-base">
            La ruta que buscas no existe o se ha movido. Comprueba la URL o
            vuelve al panel principal.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-3 font-semibold text-white transition-colors hover:bg-primary-container"
          >
            Ir al dashboard
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl border border-outline-variant px-4 py-3 font-medium text-on-surface transition-colors hover:bg-surface-container"
          >
            Ir al login
          </Link>
        </div>

        <LegalLinks className="pt-2" />
      </section>
    </div>
  );
}
