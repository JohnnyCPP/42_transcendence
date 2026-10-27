'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { RequireActiveOrg, useOrg } from '@/components/org';
import { useBoards } from '@/components/boards';

/**
 * Formulario para crear un board en el workspace activo.
 *
 * La llamada HTTP vive en `BoardsProvider.createBoard`.
 */
export default function NewProjectPage() {
  const router = useRouter();
  const { activeOrganization } = useOrg();
  const { createBoard, clearError } = useBoards();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
      setMessage('Añade al menos un nombre para preparar el proyecto.');
      return;
    }

    if (!activeOrganization) {
      setMessage('Selecciona un workspace antes de crear un tablero.');
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    clearError();

    try {
      const board = await createBoard(
        name.trim(),
        description.trim() || undefined
      );
      router.push(`/boards/${board.id}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'No se pudo crear el tablero. Inténtalo de nuevo.';
      setMessage(errorMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <RequireActiveOrg>
        <main className="min-h-screen bg-surface-bright px-4 py-10 text-on-surface md:px-8 flex items-center justify-center">
          <section className="w-full max-w-2xl rounded-[28px] border border-outline-variant bg-white p-6 shadow-sm md:p-8 space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-low px-3 py-1 text-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px] text-primary">
                library_add
              </span>
              Nuevo proyecto
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">
                Organiza un nuevo tablero
              </h1>
              <p className="text-sm text-on-surface-variant md:text-base">
                Se creará un tablero en{' '}
                <span className="font-medium text-on-surface">
                  {activeOrganization?.name}
                </span>
                .
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nombre del proyecto"
                disabled={isSubmitting}
                className="w-full rounded-xl border border-outline-variant bg-surface-bright px-4 py-3 text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe brevemente el objetivo del proyecto"
                rows={4}
                disabled={isSubmitting}
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
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-3 font-semibold text-white transition-colors hover:bg-primary-container disabled:opacity-60"
                >
                  {isSubmitting ? 'Creando…' : 'Crear proyecto'}
                </button>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-xl border border-outline-variant px-4 py-3 font-medium text-on-surface transition-colors hover:bg-surface-container"
                >
                  Volver al dashboard
                </Link>
              </div>
            </form>
          </section>
        </main>
      </RequireActiveOrg>
    </ProtectedRoute>
  );
}
