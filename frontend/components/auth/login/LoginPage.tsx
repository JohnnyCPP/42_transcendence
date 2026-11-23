'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginCredentials } from '../auth.types';
import { useAuth } from '../useAuth';
import { LoginPageView } from '.';
import type { LoginStep } from './login.types';
import type { TwoFactorMethod } from './TwoFactorForm';
import { apiFetch } from '@/lib/apiClient';

/**
 * Contenedor del flujo de login (credenciales → opcional 2FA → dashboard).
 *
 * - Credenciales: `login` → si `requires_2fa`, guarda el challenge y cambia de paso.
 * - 2FA: `complete2fa` con el challenge + código → redirige a `/dashboard`.
 * Los errores visibles los gestiona `useAuth` / `AuthProvider`.
 */
export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError, complete2fa } = useAuth();
  const [step, setStep] = useState<LoginStep>('credentials');
  const [challengeToken, setChallengeToken] = useState<string | null>(null);

  /** Envía username/password; puede pasar a paso 2FA o al dashboard. */
  const handleLogin = useCallback(
    async (credentials: LoginCredentials) => {
      try {
        clearError();
        const result = await login(credentials.username, credentials.password);

        if (result.status === 'requires_2fa') {
          setChallengeToken(result.challengeToken);
          setStep('two_factor');
          return;
        }

        router.push('/dashboard');
      } catch {
        // El error visible lo gestiona useAuth.
      }
    },
    [clearError, login, router]
  );

  /** Completa el login con TOTP o recovery code tras un challenge activo. */
  const handleTwoFactor = useCallback(
    async (code: string, method: TwoFactorMethod) => {
      if (!challengeToken) return;

      try {
        clearError();
        const result = await complete2fa(challengeToken, code, method);
        if (result.status === 'authenticated') {
          // Pocos recovery codes → ir a `/settings` a regenerarlos.
          if (method === 'recovery_code') {
            try {
              const { remaining } = await apiFetch<{ remaining: number }>(
                '/two-factor/recovery-codes/remaining'
              );
              if (remaining <= 1) {
                router.push('/settings');
                return;
              }
            } catch {
              // El acceso ha terminado correctamente aunque falle la consulta del contador.
            }
          }
          router.push('/dashboard');
        }
      } catch {
        // El error visible lo gestiona useAuth.
      }
    },
    [challengeToken, clearError, complete2fa, router]
  );

  /** Vuelve al paso de credenciales y limpia el challenge. */
  const handleBackFromTwoFactor = useCallback(() => {
    clearError();
    setChallengeToken(null);
    setStep('credentials');
  }, [clearError]);

  return (
    <LoginPageView
      isLoading={isLoading}
      error={error}
      step={step}
      onSubmit={handleLogin}
      onTwoFactorSubmit={handleTwoFactor}
      onBackFromTwoFactor={handleBackFromTwoFactor}
    />
  );
}
