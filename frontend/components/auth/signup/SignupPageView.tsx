import Link from 'next/link';
import LegalLinks from '@/components/layout/LegalLinks';
import { SignupPageFormProps, SignupPageForm } from './';

/**
 * Vista de registro (presentación).
 *
 * Encapsula layout, copy y composición visual del formulario.
 * No realiza llamadas API ni validación de negocio.
 */
export function SignupPageView({
  username,
  setUsername,
  email,
  setEmail,
  password,
  setPassword,
  formMessage,
  error,
  isLoading,
  handleSubmit,
}: SignupPageFormProps) {
  return (
    <main className="min-h-screen bg-surface-bright px-4 py-10 text-on-surface md:px-8 flex flex-col items-center justify-center gap-6">
      <section className="w-full max-w-xl rounded-[28px] border border-outline-variant bg-white p-6 shadow-sm md:p-8 space-y-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-low px-3 py-1 text-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px] text-primary">
            person_add
          </span>
          Crear acceso
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Prepara tu acceso</h1>
          <p className="text-sm text-on-surface-variant md:text-base">
            Crea tu cuenta con username y contraseña para acceder al workspace.
          </p>
        </div>

        <SignupPageForm
          username={username}
          setUsername={setUsername}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          formMessage={formMessage}
          error={error}
          isLoading={isLoading}
          handleSubmit={handleSubmit}
        />

        <p className="text-center text-sm text-on-surface-variant">
          ¿Ya tienes cuenta?{' '}
          <Link
            href="/login"
            className="font-medium text-primary transition-colors hover:text-primary-container"
          >
            Inicia sesión
          </Link>
        </p>
      </section>

      <LegalLinks />
    </main>
  );
}
