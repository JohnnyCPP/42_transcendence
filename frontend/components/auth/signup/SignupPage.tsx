'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/components/auth/useAuth';
import { validateSignupForm } from '@/components/auth/signup/signupPage.utils';
import { SignupPageView } from '@/components/auth/signup/';
import { FormValues } from '@/components/ui/TextInput';


/**
 * Contenedor del flujo de registro.
 *
 * Responsabilidades:
 * - Mantener estado de formulario
 * - Validar datos antes de enviar
 * - Ejecutar el `signup` real contra backend
 * - Redirigir al dashboard tras éxito
 */
export default function SignupPage() {
  const router = useRouter();
  // Estado y acciones de autenticación centralizadas en el hook de dominio.
  const { signup, isLoading, error, clearError } = useAuth();

  // Estado local del formulario (inputs controlados).
  const [form, setForm] = useState<FormValues>({
    username: '',
    email: '',
    password: '',
  });

    const { username, email, password } = form;

    const setUsername = (value: string) => setForm((prev) => ({ ...prev, username: value }));
    const setEmail = (value: string) => setForm((prev) => ({ ...prev, email: value }));
    const setPassword = (value: string) => setForm((prev) => ({ ...prev, password: value }));

  // Mensaje de feedback de validación/éxito mostrado en la vista.
  const [formMessage, setFormMessage] = useState<string | null>(null);

  /**
   * Submit principal del alta.
   *
   * Flujo:
   * 1) limpia errores previos
   * 2) normaliza datos
   * 3) valida reglas de formulario
   * 4) llama al endpoint real mediante `signup`
   * 5) redirige si todo fue correcto
   */
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearError();
    setFormMessage(null);

    // Normalización mínima antes de validar/enviar.
    const cleanUsername = username.trim();
    const cleanEmail = email.trim();

    // Validación de negocio desacoplada en utilidad pura.
    const validationError = validateSignupForm(cleanUsername, password, cleanEmail || null);
    if (validationError) {
      setFormMessage(validationError);
      return;
    }

    try {
      // Registro real en backend (cookie de sesión manejada por `useAuth`).
      await signup(cleanUsername, password, cleanEmail || undefined);
      setFormMessage('Cuenta creada correctamente. Redirigiendo...');
      router.push('/dashboard');
    } catch {
      // El detalle del error lo gestiona y expone `useAuth` en `error`.
    }
  };

  return (
    // Capa de presentación: solo recibe datos + handlers y renderiza UI.
    <SignupPageView
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
  );
}