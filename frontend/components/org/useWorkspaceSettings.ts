'use client';

import { useCallback, useEffect, useState } from 'react';
import { useOrg } from './useOrg';
import { useRouter } from 'next/navigation';
import { useRoles } from '@/lib/useRoles';
/**
 * Estado y handlers de `/workspace/settings`: editar name/slug y eliminar.
 *
 * `updateOrganization` → `PATCH /organizations/:id`
 * `deleteOrganization` → `DELETE /organizations/:id` (owner); redirige a `/workspace`.
 */
export function useWorkspaceSettings() {
	const { canManageOrganization, canArchiveOrganization } = useRoles();
  const {
    activeOrganization,
    updateOrganization,
    deleteOrganization,
    clearError,
  } = useOrg();
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!activeOrganization) return;
    setName(activeOrganization.name);
    setSlug(activeOrganization.slug);
  }, [activeOrganization]);

  const handleSave = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
	  if (!canManageOrganization) return;
      if (!activeOrganization) return;

      setError(null);
      setSuccess(null);
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
    [activeOrganization, name, slug, updateOrganization, clearError, canManageOrganization]
  );

  const handleDeleteConfirm = useCallback(async () => {
	if (!canArchiveOrganization) return;
    if (!activeOrganization) return;
    setIsDeleteOpen(false);
    setError(null);
    setSuccess(null);
    setIsDeleting(true);
    try {
      await deleteOrganization(activeOrganization.id);
      router.push('/workspace');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo eliminar el workspace'
      );
    } finally {
      setIsDeleting(false);
    }
  }, [activeOrganization, deleteOrganization, router, canArchiveOrganization]);


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
    handleSave,
    handleDeleteConfirm,
	canManageOrganization,
	canArchiveOrganization,
  };
}
