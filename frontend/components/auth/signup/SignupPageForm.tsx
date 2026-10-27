import Link from 'next/link';
import { SignupPageFormProps } from './';
import TextInput from '@/components/ui/TextInput';

/**
 * Formulario presentacional de registro.
 *
 * No contiene lógica de negocio: recibe todo por props desde el contenedor.
 */
export function SignupPageForm({ username, setUsername, email, setEmail, password, setPassword, formMessage, error, isLoading, handleSubmit }: SignupPageFormProps) {

    return (
        // El submit real lo resuelve `SignupPage` (contenedor).
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username obligatorio */}
          <TextInput
            id="username"
            name="username"
            type="text"
            value={username}
            placeholder="Username"
            onChange={setUsername}
          />

          {/* Email opcional */}
          <TextInput
            id="email"
            name="email"
            type="email"
            value={email}
            placeholder="tu@empresa.com (opcional)"
            onChange={setEmail}
          />

          {/* Contraseña con requisito mínimo de longitud */}
          <TextInput
            id="password"
            name="password"
            type="password"
            value={password}
            placeholder="Crea una contraseña (mínimo 12 caracteres)"
            onChange={setPassword}
          />

          {/* Mensaje local (validación/éxito) */}
          {formMessage && (
            <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-sm text-primary">
              {formMessage}
            </div>
          )}

          {/* Error proveniente del backend vía `useAuth` */}
          {error && (
            <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Acciones primarias/secundarias */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-3 font-semibold text-white transition-colors hover:bg-primary-container"
            >
              {isLoading ? 'Creando cuenta...' : 'Continuar'}
            </button>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl border border-outline-variant px-4 py-3 font-medium text-on-surface transition-colors hover:bg-surface-container"
            >
              Volver al login
            </Link>
          </div>
        </form>
    );
}