'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginCredentials } from '../auth.types';
import { useAuth } from '../useAuth';
import { LoginPageView } from '.';
import type { LoginStep } from './login.types';
import type { TwoFactorMethod } from './TwoFactorForm';

/**
 * Contenedor del flujo de login (credenciales → opcional 2FA → dashboard).
 *
 * La integración de `complete2fa` queda para ti: ver `handleTwoFactor`.
 */
export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuth();
  const [step, setStep] = useState<LoginStep>('credentials');
  const [challengeToken, setChallengeToken] = useState<string | null>(null);

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

  /**
   * TODO (tú): integra `complete2fa` aquí.
   *
   * Ya tienes:
   * - `challengeToken` en estado (de `requires_2fa`)
   * - `code` y `method` que llegan del formulario
   *
   * Pasos:
   * 1. Saca `complete2fa` de `useAuth()`
   * 2. `await complete2fa(challengeToken, code, method)`
   * 3. Si va bien → `router.push('/dashboard')`
   * 4. El error de auth ya lo pone el provider; captura el throw para no romper React
   */
  const handleTwoFactor = useCallback(
    async (code: string, method: TwoFactorMethod) => {
      if (!challengeToken) return;

      try {
        clearError();
        // --- tu integración de complete2fa va aquí ---
        void code;
        void method;
        throw new Error('TODO: llama a complete2fa(challengeToken, code, method)');
        // router.push('/dashboard');
      } catch {
        // El error visible lo gestiona useAuth (cuando cables complete2fa).
      }
    },
    [challengeToken, clearError]
  );

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
