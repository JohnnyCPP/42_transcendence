import EmailLoginForm from './EmailLoginForm';
import { LoginFormCardProps } from './login.types';

/**
 * Contenedor visual del formulario de login.
 *
 * Solo presenta UI; el envío lo resuelve el contenedor padre.
 */
export function LoginFormCard({ isLoading, error, onSubmit }: LoginFormCardProps) {
  return (
    <section>
      <div className="w-full rounded-[28px] border border-outline-variant bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-semibold text-on-surface">Acceso por usuario</h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            Usa tu nombre de usuario para entrar al tablero.
          </p>
        </div>

        {/* Formulario presentacional; la lógica de envío la define el contenedor. */}
        <EmailLoginForm
          onSubmit={onSubmit}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </section>
  );
}
