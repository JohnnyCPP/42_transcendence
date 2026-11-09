import EmailLoginForm from './EmailLoginForm';
import { LoginFormCardProps } from './login.types';
import { uiStyles } from '@/components/ui';

/**
 * Contenedor visual del formulario de login.
 *
 * Solo presenta UI; el envío lo resuelve el contenedor padre.
 */
export function LoginFormCard({ isLoading, error, onSubmit }: LoginFormCardProps) {
  return (
    <section>
      <div className={`w-full ${uiStyles.authCard}`}>
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-semibold text-on-surface">Acceso por usuario</h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            Usa tu nombre de usuario para entrar al tablero.
          </p>
        </div>

        <EmailLoginForm
          onSubmit={onSubmit}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </section>
  );
}
