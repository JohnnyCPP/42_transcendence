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
 */
export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError, complete2fa } = useAuth();
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

  const handleTwoFactor = useCallback(
    async (code: string, method: TwoFactorMethod) => {
      if (!challengeToken) return;

      try {
        clearError();
        const result = await complete2fa(challengeToken, code, method);
        if (result.status === 'authenticated') router.push('/dashboard');
      } catch {
        // El error visible lo gestiona useAuth.
      }
    },
    [challengeToken, clearError, complete2fa, router]
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
