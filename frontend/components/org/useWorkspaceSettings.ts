'use client';

import { useCallback, useEffect, useState } from 'react';
import { useOrg } from './useOrg';

/**
 * Estado y handlers de `/workspace/settings`: editar name/slug y eliminar (UI).
 *
 * `updateOrganization` usa stub PATCH; `deleteOrganization` es no-op hasta
 * que exista el endpoint DELETE en el BE.
 */
export function useWorkspaceSettings() {
  const {
    activeOrganization,
    updateOrganization,
    deleteOrganization,
    clearError,
  } = useOrg();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!activeOrganization) return;
    setName(activeOrganization.name);
    setSlug(activeOrganization.slug);
  }, [activeOrganization]);

  const handleSave = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!activeOrganization) return;

      setError(null);
      setSuccess(null);
      setDeleteNotice(null);
      clearError();

      const trimmedName = name.trim();
      const trimmedSlug = slug.trim();
      if (trimmedName.length < 2) {
        setError('El nombre debe tener al menos 2 caracteres');
        return;
      }
      if (trimmedSlug.length < 2) {
        setError('El slug debe tener al menos 2 caracteres');
        return;
      }

      setIsSaving(true);
      try {
        await updateOrganization(activeOrganization.id, {
          name: trimmedName,
          slug: trimmedSlug,
        });
        setSuccess('Workspace actualizado.');
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'No se pudo guardar el workspace'
        );
      } finally {
        setIsSaving(false);
      }
    },
    [activeOrganization, name, slug, updateOrganization, clearError]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!activeOrganization) return;
    setIsDeleteOpen(false);
    setError(null);
    setSuccess(null);
    setIsDeleting(true);
    try {
      await deleteOrganization(activeOrganization.id);
      setDeleteNotice(
        'Eliminación pendiente de API: la UI está lista; el endpoint DELETE aún no existe.'
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo eliminar el workspace'
      );
    } finally {
      setIsDeleting(false);
    }
  }, [activeOrganization, deleteOrganization]);

  return {
    name,
    setName,
    slug,
    setSlug,
    isSaving,
    isDeleting,
    isDeleteOpen,
    setIsDeleteOpen,
    error,
    success,
    deleteNotice,
    handleSave,
    handleDeleteConfirm,
  };
}
