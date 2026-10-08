'use client';

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import EmailLoginForm from './EmailLoginForm';
import { LoginCredentials } from './auth.types';


function LoginHeader() {
  return (
    <section className="text-center space-y-4">
        <div className="inline-flex items-center gap-3 rounded-full border border-outline-variant bg-white px-4 py-2 text-sm text-on-surface-variant shadow-sm">
          <span className="material-symbols-outlined text-[18px] text-primary">
            lock
          </span>
          Acceso seguro al espacio de trabajo
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
            TaskFlow
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            Inicia sesión para continuar.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-on-surface-variant md:text-lg">
            Accede a tu espacio de trabajo y revisa el estado de tus boards, tareas y actividad reciente.
          </p>
        </div>
      </section>
  );
}

function LoginFormCard({successMessage, isLoading, error, handleEmailLogin}: {
  successMessage: string | null;
  isLoading: boolean;
  error: string | null;
  handleEmailLogin: (credentials: LoginCredentials) => Promise<void>;
}) {

  return (
    <section>
      <div className="w-full rounded-[28px] border border-outline-variant bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-semibold text-on-surface">Email login</h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            Usa tu correo corporativo para entrar al tablero.
          </p>
        </div>
        {successMessage && (
          <div className="mb-4 rounded-xl border border-primary/20 bg-primary/10 p-3 text-sm text-primary">
            {successMessage}
          </div>
        )}
        {/* Formulario controlado por estado local; aún no persiste sesión real. */}
        <EmailLoginForm
          onSubmit={handleEmailLogin}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </section>
  );

}

/**
 * Pantalla principal de login.
 *
 * Centraliza el copy de bienvenida, la tarjeta del formulario y el estado
 * temporal de autenticación. Por ahora el flujo es simulado para que la UI
 * quede navegable sin dependencia del backend.
 */
export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /**
   * Login de prueba con email y contraseña.
   *
   * Esta función todavía no habla con la API real; solo reproduce un flujo
   * de éxito/error para validar la experiencia visual del formulario.
   */
  const handleEmailLogin = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 900));

      if (credentials.email === 'test@error.com') {
        throw new Error('Invalid credentials');
      }

      setSuccessMessage('Acceso validado en esta vista. El siguiente paso será completar la experiencia de entrada desde el propio frontend.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <main className="relative min-h-screen bg-surface-bright px-4 py-10 text-on-surface md:px-8 flex items-center justify-center">
      <div className="w-full max-w-xl space-y-6">
        {/* Cabecera informativa: explica el contexto del acceso. */}
        <LoginHeader />


        {/* Tarjeta que contiene el formulario reutilizable de autenticación. */}
        <LoginFormCard
          successMessage={successMessage}
          isLoading={isLoading}
          error={error}
          handleEmailLogin={handleEmailLogin}
        />
      </div>

      {/* El enlace existe como guía visual, la ruta ya está implementada pero falta completar la experiencia de registro. */}
      <div className="absolute bottom-6 left-1/2 w-full max-w-xl -translate-x-1/2 px-4 text-center text-sm text-on-surface-variant md:px-8">
        ¿No tienes una cuenta?{' '}
        <Link href="/signup" className="font-medium text-primary transition-colors hover:text-primary-container">
          Regístrate
        </Link>
      </div>
    </main>
  );
}
