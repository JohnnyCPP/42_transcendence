import Link from 'next/link';
import LegalLinks from '@/components/layout/LegalLinks';
import { AuthCard } from '@/components/ui';
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
    <AuthCard
      badgeIcon="person_add"
      badgeLabel="Crear acceso"
      title="Prepara tu acceso"
      description="Crea tu cuenta con username y contraseña para acceder al workspace."
      shellClassName="flex-col gap-6"
      footer={<LegalLinks />}
    >
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
    </AuthCard>
  );
}
