'use client';

import React, { useState, useCallback } from 'react';
import { LoginCredentials } from '../auth.types';
import Link from 'next/link';

interface EmailLoginFormProps {
  onSubmit: (credentials: LoginCredentials) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}


function ValidateLoginForm(username: string, password: string): string | null {

      if (!username.trim()) {
        return 'El nombre de usuario es obligatorio';
      }

      else if (!password) {
        return 'La contraseña es obligatoria';
      }
      return null;
}

/**
 * Formulario controlado de acceso por usuario y contraseña.
 *
 * La pantalla padre decide qué pasa cuando el usuario envía el formulario;
 * este componente solo gestiona inputs, validación básica y feedback visual.
 */
export default function EmailLoginForm({
  onSubmit,
  isLoading = false,
  error,
}: EmailLoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLocalError(null);

      // Validación mínima antes de delegar al handler externo.
      const validationError = ValidateLoginForm(username, password);
      if (validationError) {
        setLocalError(validationError);
        return;
      }

      try {
        await onSubmit({ username: username.trim(), password });
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : 'No se pudo iniciar sesión');
      }
    },
    [username, password, onSubmit]
  );

  // Si llega un error desde el padre, tiene prioridad sobre el local.
  const displayError = error || localError;

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      {/* Campo de usuario: se usa para identificar al usuario en el login. */}
      <div className="space-y-2">
        <label htmlFor="username" className="text-sm font-medium text-on-surface">
          Nombre de usuario
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="usuario"
          disabled={isLoading}
          className="w-full rounded-xl border border-outline-variant bg-surface-bright px-4 py-3 text-on-surface placeholder-on-surface-variant transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {/* Campo de contraseña: permite alternar visibilidad para facilitar el uso. */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-on-surface">
            Contraseña
          </label>
          <Link
            href="/forgot-password"
            className="text-xs text-primary hover:text-primary-container transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={isLoading}
            className="w-full rounded-xl border border-outline-variant bg-surface-bright px-4 py-3 pr-12 text-on-surface placeholder-on-surface-variant transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={showPassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors hover:text-on-surface disabled:opacity-50"
            disabled={isLoading}
          >
            <span className="material-symbols-outlined text-[20px]">
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        </div>
      </div>

      {/* Mensaje de error compartido entre validación local y respuesta externa. */}
      {displayError && (
        <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
              error
            </span>
            <span>{displayError}</span>
          </div>
        </div>
      )}

      {/* Acción principal del formulario. */}
      <button
        type="submit"
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-white transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading && (
          <span className="material-symbols-outlined text-[20px] animate-spin">
            hourglass_empty
          </span>
        )}
        <span>{isLoading ? 'Iniciando sesión...' : 'Entrar'}</span>
      </button>
    </form>
  );
}
