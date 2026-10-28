'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { RequireActiveOrg, useOrg } from '@/components/org';
import { useBoards } from '@/components/boards';
import {
  AuthCard,
  Button,
  buttonClassName,
  uiStyles,
} from '@/components/ui';

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
        <AuthCard
          badgeIcon="library_add"
          badgeLabel="Nuevo proyecto"
          title="Organiza un nuevo tablero"
          description={
            <>
              Se creará un tablero en{' '}
              <span className="font-medium text-on-surface">
                {activeOrganization?.name}
              </span>
              .
            </>
          }
          maxWidthClassName="max-w-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nombre del proyecto"
              disabled={isSubmitting}
              className={uiStyles.input}
            />
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe brevemente el objetivo del proyecto"
              rows={4}
              disabled={isSubmitting}
              className={uiStyles.input}
            />

            {message && <div className={uiStyles.infoCallout}>{message}</div>}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creando…' : 'Crear proyecto'}
              </Button>
              <Link
                href="/dashboard"
                className={buttonClassName({ variant: 'secondary', size: 'lg' })}
              >
                Volver al dashboard
              </Link>
            </div>
          </form>
        </AuthCard>
      </RequireActiveOrg>
    </ProtectedRoute>
  );
}
