import Link from 'next/link';
import LegalLinks from '@/components/layout/LegalLinks';
import { AuthCard, buttonClassName } from '@/components/ui';

/**
 * Página 404 de TaskFlow.
 *
 * Se muestra cuando la ruta no existe en el App Router de Next.js.
 */
export default function NotFound() {
  return (
    <div className="flex h-screen w-full items-center justify-center overflow-y-auto bg-surface-bright px-4 py-10 text-on-surface">
      <AuthCard
        withShell={false}
        badgeIcon="explore_off"
        badgeLabel="Error 404"
        badgeCentered
        title="Página no encontrada"
        description="La ruta que buscas no existe o se ha movido. Comprueba la URL o vuelve al panel principal."
        maxWidthClassName="max-w-lg"
        className="text-center md:p-10 space-y-6"
      >
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/dashboard"
            className={buttonClassName({ variant: 'primary', size: 'lg' })}
          >
            Ir al dashboard
          </Link>
          <Link
            href="/login"
            className={buttonClassName({ variant: 'secondary', size: 'lg' })}
          >
            Ir al login
          </Link>
        </div>

        <LegalLinks className="pt-2" />
      </AuthCard>
    </div>
  );
}
