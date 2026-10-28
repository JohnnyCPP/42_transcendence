'use client';

import React, { useState, useCallback } from 'react';
import { LoginCredentials } from '../auth.types';
import Link from 'next/link';
import { Button, Icon, uiStyles, cx } from '@/components/ui';

interface EmailLoginFormProps {
  onSubmit: (credentials: LoginCredentials) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

function ValidateLoginForm(username: string, password: string): string | null {
  if (!username.trim()) {
    return 'El nombre de usuario es obligatorio';
  }

  if (!password) {
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

  const displayError = error || localError;
  const inputClassName = cx(
    uiStyles.input,
    'placeholder-on-surface-variant transition-all disabled:cursor-not-allowed disabled:opacity-50'
  );

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <div className="space-y-2">
        <label htmlFor="username" className={uiStyles.formLabel}>
          Nombre de usuario
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="usuario"
          disabled={isLoading}
          className={inputClassName}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className={uiStyles.formLabel}>
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
            className={cx(inputClassName, 'pr-12')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={showPassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors hover:text-on-surface disabled:opacity-50"
            disabled={isLoading}
          >
            <Icon name={showPassword ? 'visibility_off' : 'visibility'} size="lg" />
          </button>
        </div>
      </div>

      {displayError && (
        <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
          <div className="flex items-start gap-2">
            <Icon name="error" size="md" className="shrink-0 mt-0.5" />
            <span>{displayError}</span>
          </div>
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        disabled={isLoading}
        className="gap-2 disabled:opacity-50"
      >
        {isLoading && (
          <Icon name="hourglass_empty" size="lg" className="animate-spin" />
        )}
        <span>{isLoading ? 'Iniciando sesión...' : 'Entrar'}</span>
      </Button>
    </form>
  );
}
