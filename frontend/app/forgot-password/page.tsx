'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim()) {
      setMessage('Introduce tu correo para continuar con la recuperación.');
      return;
    }

    setMessage('La recuperación ya tiene una pantalla dedicada. El siguiente paso será enlazar este flujo con el envío real de instrucciones.');
  };

  return (
    <main className="min-h-screen bg-surface-bright px-4 py-10 text-on-surface md:px-8 flex items-center justify-center">
      <section className="w-full max-w-xl rounded-[28px] border border-outline-variant bg-white p-6 shadow-sm md:p-8 space-y-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-low px-3 py-1 text-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px] text-primary">lock_reset</span>
          Acceso y recuperación
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Recuperar contraseña</h1>
          <p className="text-sm text-on-surface-variant md:text-base">
            Indica tu correo para preparar el siguiente paso del flujo de recuperación desde la propia interfaz.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            placeholder="tu@empresa.com"
            className="w-full rounded-xl border border-outline-variant bg-surface-bright px-4 py-3 text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />

          {message && (
            <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-sm text-primary">
              {message}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-3 font-semibold text-white transition-colors hover:bg-primary-container"
            >
              Continuar
            </button>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl border border-outline-variant px-4 py-3 font-medium text-on-surface transition-colors hover:bg-surface-container"
            >
              Volver al login
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}