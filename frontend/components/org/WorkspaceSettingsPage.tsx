'use client';

import { useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import {
  Button,
  ConfirmDialog,
  FormErrorBanner,
  Icon,
  TextInput,
  buttonClassName,
  uiStyles,
} from '@/components/ui';
import { OrganizationMembers } from './OrganizationMembers';
import { RequireActiveOrg } from './RequireActiveOrg';
import { useWorkspaceSettings } from './useWorkspaceSettings';

export function WorkspaceSettingsHeader() {
  return (
    <section className="space-y-2">
      <p className={uiStyles.pageKicker}>Workspace</p>
      <h1 className={uiStyles.pageTitle}>Ajustes del workspace</h1>
      <p className={`max-w-2xl ${uiStyles.pageLead}`}>
        Edita el nombre y el slug del espacio activo, gestiona miembros y
        roles. Eliminar archiva el workspace (solo el owner) y vuelve al
        listado.
      </p>
      <Link
        href="/workspace"
        className={buttonClassName({ variant: 'ghost', size: 'sm' })}
      >
        <Icon name="arrow_back" size="sm" />
        Volver a workspaces
      </Link>
    </section>
  );
}

interface WorkspaceSettingsFormProps {
  form: ReturnType<typeof useWorkspaceSettings>;
}

/**
 * Formulario de edición + acciones guardar / eliminar (abre el ConfirmDialog).
 * Guardar: owner/admin. Eliminar: solo owner. Members ven campos en solo lectura.
 */
export function WorkspaceSettingsForm({ form }: WorkspaceSettingsFormProps) {
  const fieldsDisabled =
    form.isSaving || form.isDeleting || !form.canManageOrganization;

  return (
    <form
      onSubmit={form.handleSave}
      className={`max-w-xl space-y-4 ${uiStyles.surfaceCard}`}
    >
      <TextInput
        id="workspace-name"
        name="name"
        label="Nombre"
        value={form.name}
        disabled={fieldsDisabled}
        onChange={form.setName}
        placeholder="Nombre del workspace"
      />
      <TextInput
        id="workspace-slug"
        name="slug"
        label="Slug"
        value={form.slug}
        disabled={fieldsDisabled}
        onChange={form.setSlug}
        placeholder="mi-workspace"
      />

      {!form.canManageOrganization && (
        <p className="text-sm text-on-surface-variant">
          Solo puedes consultar estos ajustes; no tienes permiso para editarlos.
        </p>
      )}

      <FormErrorBanner error={form.error} />

      {form.success && <p className={uiStyles.infoCallout}>{form.success}</p>}

      {(form.canManageOrganization || form.canArchiveOrganization) && (
        <div className="flex flex-wrap gap-2 pt-2">
          {form.canManageOrganization && (
            <Button
              type="submit"
              variant="primary"
              disabled={form.isSaving || form.isDeleting}
              className="gap-2"
            >
              {form.isSaving && (
                <Icon name="hourglass_empty" size="md" className="animate-spin" />
              )}
              {form.isSaving ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          )}
          {form.canArchiveOrganization && (
            <Button
              type="button"
              variant="danger"
              disabled={form.isSaving || form.isDeleting}
              onClick={() => form.setIsDeleteOpen(true)}
            >
              Eliminar workspace
            </Button>
          )}
        </div>
      )}
    </form>
  );
}

/**
 * Hub del workspace activo: general (name/slug/archive) + miembros.
 */
export function WorkspaceSettingsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const form = useWorkspaceSettings();

  return (
    <ProtectedRoute>
      <RequireActiveOrg>
        <AppShell searchQuery={searchQuery} onSearchChange={setSearchQuery}>
          <div className={`${uiStyles.pageContent} space-y-8`}>
            <WorkspaceSettingsHeader />
            <WorkspaceSettingsForm form={form} />
            <OrganizationMembers />
          </div>
        </AppShell>

        <ConfirmDialog
          isOpen={form.isDeleteOpen}
          title="Eliminar workspace"
          description={`Vas a archivar «${form.name || 'este workspace'}». Esta acción requiere ser owner y no se puede deshacer desde la UI.`}
          confirmLabel="Eliminar"
          tone="danger"
          onConfirm={() => {
            void form.handleDeleteConfirm();
          }}
          onClose={() => form.setIsDeleteOpen(false)}
        />
      </RequireActiveOrg>
    </ProtectedRoute>
  );
}
