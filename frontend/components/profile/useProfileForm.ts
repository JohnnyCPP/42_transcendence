'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/components/auth';
import { ApiError } from '@/lib/apiClient';
import { updateMyProfile } from '@/lib/profileApi';

function mapProfileSaveError(err: unknown): string {
  if (err instanceof ApiError && (err.status === 404 || err.status === 405)) {
    return 'Guardar el perfil aún no está disponible en el servidor. Cuando exista PATCH /me, este formulario funcionará sin cambios.';
  }
  if (err instanceof Error) return err.message;
  return 'No se pudo guardar el perfil';
}

/**
 * Estado y submit de `/profile`: editar displayName y email.
 *
 * Hidrata desde `useAuth().user`. Tras guardar llama `refreshToken` (`GET /me`)
 * para sincronizar el menú y el resto de la UI.
 */
export function useProfileForm() {
  const { user, refreshToken } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.name ?? '');
    setEmail(user.email ?? '');
  }, [user]);

  const handleSave = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!user) return;

      setError(null);
      setSuccess(null);

      const trimmedName = displayName.trim();
      const trimmedEmail = email.trim();

      if (trimmedName.length < 1) {
        setError('El nombre visible no puede estar vacío.');
        return;
      }
      if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        setError('Introduce un correo válido o déjalo vacío.');
        return;
      }

      setIsSaving(true);
      try {
        await updateMyProfile({
          displayName: trimmedName,
          email: trimmedEmail || null,
        });
        await refreshToken();
        setSuccess('Perfil actualizado.');
      } catch (err) {
        setError(mapProfileSaveError(err));
      } finally {
        setIsSaving(false);
      }
    },
    [user, displayName, email, refreshToken]
  );

  return {
    user,
    displayName,
    setDisplayName,
    email,
    setEmail,
    isSaving,
    error,
    success,
    handleSave,
  };
}
