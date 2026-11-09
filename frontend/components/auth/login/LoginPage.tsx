'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LoginCredentials } from '../auth.types';
import { useAuth } from '../useAuth';
import { LoginPageView } from '.';

/**
 * Contenedor del flujo de login.
 *
 * Centraliza la llamada a la API de autenticación y la redirección
 * tras un acceso correcto.
 */
export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuth();

  /**
   * Envía las credenciales al backend y, si la sesión se crea bien,
   * lleva al usuario al dashboard.
   *
   * El error visible lo gestiona `useAuth`; aquí solo evitamos
   * que una excepción no controlada rompa el árbol de React.
   */
  const handleLogin = useCallback(
    async (credentials: LoginCredentials) => {
      try {
        // Limpia un error previo antes de un nuevo intento.
        clearError();
        await login(credentials.username, credentials.password);
        router.push('/dashboard');
      } catch (err) {
        // console.error(err);
      }
    },
    [clearError, login, router]
  );

  return (
    <LoginPageView
      isLoading={isLoading}
      error={error}
      onSubmit={handleLogin}
    />
  );
}
