import EmailLoginForm from './EmailLoginForm';
import TwoFactorForm from './TwoFactorForm';
import { LoginFormCardProps } from './login.types';
import { uiStyles } from '@/components/ui';

/**
 * Contenedor visual del formulario de login (credenciales o 2FA).
 */
export function LoginFormCard({
  isLoading,
  error,
  step,
  onSubmit,
  onTwoFactorSubmit,
  onBackFromTwoFactor,
}: LoginFormCardProps) {
  const isTwoFactor = step === 'two_factor';

  return (
    <section>
      <div className={`w-full ${uiStyles.authCard}`}>
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-semibold text-on-surface">
            {isTwoFactor ? 'Verificación en dos pasos' : 'Acceso por usuario'}
          </h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            {isTwoFactor
              ? 'Introduce el código de tu autenticador o uno de recuperación.'
              : 'Usa tu nombre de usuario para entrar al tablero.'}
          </p>
        </div>

        {isTwoFactor ? (
          <TwoFactorForm
            isLoading={isLoading}
            error={error}
            onSubmit={onTwoFactorSubmit}
            onBack={onBackFromTwoFactor}
          />
        ) : (
          <EmailLoginForm
            onSubmit={onSubmit}
            isLoading={isLoading}
            error={error}
          />
        )}
      </div>
    </section>
  );
}
