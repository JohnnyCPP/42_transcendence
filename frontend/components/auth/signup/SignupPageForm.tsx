import Link from 'next/link';
import { SignupPageFormProps } from './';
import TextInput from '@/components/ui/TextInput';
import { Button, buttonClassName, uiStyles } from '@/components/ui';

/**
 * Formulario presentacional de registro.
 *
 * No contiene lógica de negocio: recibe todo por props desde el contenedor.
 */
export function SignupPageForm({
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <TextInput
        id="username"
        name="username"
        type="text"
        value={username}
        placeholder="Username"
        onChange={setUsername}
      />

      <TextInput
        id="email"
        name="email"
        type="email"
        value={email}
        placeholder="tu@empresa.com (opcional)"
        onChange={setEmail}
      />

      <TextInput
        id="password"
        name="password"
        type="password"
        value={password}
        placeholder="Crea una contraseña (mínimo 12 caracteres)"
        onChange={setPassword}
      />

      {formMessage && <div className={uiStyles.infoCallout}>{formMessage}</div>}

      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" variant="primary" size="lg" disabled={isLoading}>
          {isLoading ? 'Creando cuenta...' : 'Continuar'}
        </Button>
        <Link
          href="/login"
          className={buttonClassName({ variant: 'secondary', size: 'lg' })}
        >
          Volver al login
        </Link>
      </div>
    </form>
  );
}
