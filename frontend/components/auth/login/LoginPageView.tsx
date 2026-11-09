import Link from 'next/link';
import LegalLinks from '@/components/layout/LegalLinks';
import { uiStyles, cx } from '@/components/ui';
import { LoginHeader, LoginFormCard, LoginPageViewProps } from './';

/**
 * Capa de presentación del login:
 * monta la estructura visual y recibe todo por props.
 */
export function LoginPageView({ isLoading, error, onSubmit }: LoginPageViewProps) {
  return (
    <main
      className={cx(
        uiStyles.authShell,
        'relative'
      )}
    >
      <div className="w-full max-w-xl space-y-6 pb-16">
        <LoginHeader />

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
