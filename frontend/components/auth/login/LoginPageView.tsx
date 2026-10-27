import Link from 'next/link';
import LegalLinks from '@/components/layout/LegalLinks';
import { LoginHeader, LoginFormCard, LoginPageViewProps } from './';

/**
 * Capa de presentación del login:
 * monta la estructura visual y recibe todo por props.
 */
export function LoginPageView({ isLoading, error, onSubmit }: LoginPageViewProps) {
  return (
    <main className="relative min-h-screen bg-surface-bright px-4 py-10 text-on-surface md:px-8 flex items-center justify-center">
      <div className="w-full max-w-xl space-y-6 pb-16">
        {/* Cabecera informativa del acceso. */}
        <LoginHeader />

        {/* Tarjeta con el formulario de autenticación. */}
        <LoginFormCard
          isLoading={isLoading}
          error={error}
          onSubmit={onSubmit}
        />
      </div>

      <div className="absolute bottom-6 left-1/2 w-full max-w-xl -translate-x-1/2 px-4 text-center text-sm text-on-surface-variant md:px-8 space-y-3">
        <p>
          ¿No tienes una cuenta?{' '}
          <Link
            href="/signup"
            className="font-medium text-primary transition-colors hover:text-primary-container"
          >
            Regístrate
          </Link>
        </p>
        <LegalLinks />
      </div>
    </main>
  );
}
