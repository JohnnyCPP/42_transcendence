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
import { RequireActiveOrg } from './RequireActiveOrg';
import { useWorkspaceSettings } from './useWorkspaceSettings';

/**
 * Cabecera de la página: título, lead y enlace de vuelta a `/workspace`.
 */
export function WorkspaceSettingsHeader() {
  return (
    <section className="space-y-2">
      <p className={uiStyles.pageKicker}>Workspace</p>
      <h1 className={uiStyles.pageTitle}>Ajustes del workspace</h1>
      <p className={`max-w-2xl ${uiStyles.pageLead}`}>
        Edita el nombre y el slug del espacio activo. La eliminación muestra el
        flujo de confirmación; la API la conectará tu compañero.
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
 */
export function WorkspaceSettingsForm({ form }: WorkspaceSettingsFormProps) {
  return (
    <form
      onSubmit={form.handleSave}
      className="max-w-xl space-y-4 rounded-2xl border border-outline-variant bg-white p-5 shadow-sm md:p-6"
    >
      <TextInput
        id="workspace-name"
        name="name"
        label="Nombre"
        value={form.name}
        disabled={form.isSaving || form.isDeleting}
        onChange={form.setName}
        placeholder="Nombre del workspace"
      />
      <TextInput
        id="workspace-slug"
        name="slug"
        label="Slug"
        value={form.slug}
        disabled={form.isSaving || form.isDeleting}
        onChange={form.setSlug}
        placeholder="mi-workspace"
      />

      <FormErrorBanner error={form.error} />

      {form.success && <p className={uiStyles.infoCallout}>{form.success}</p>}
      {form.deleteNotice && (
        <p className={uiStyles.infoCallout}>{form.deleteNotice}</p>
      )}

      <div className="flex flex-wrap gap-2 pt-2">
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
        <Button
          type="button"
          variant="danger"
          disabled={form.isSaving || form.isDeleting}
          onClick={() => form.setIsDeleteOpen(true)}
        >
          Eliminar workspace
        </Button>
      </div>
    </form>
  );
}

/**
 * Ajustes del workspace activo: editar name/slug y eliminar (UI no conectada).
 */
export function WorkspaceSettingsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const form = useWorkspaceSettings();

  return (
    <ProtectedRoute>
      <RequireActiveOrg>
        <AppShell searchQuery={searchQuery} onSearchChange={setSearchQuery}>
          <div className={uiStyles.pageContent}>
            <WorkspaceSettingsHeader />
            <WorkspaceSettingsForm form={form} />
          </div>
        </AppShell>

        <ConfirmDialog
          isOpen={form.isDeleteOpen}
          title="Eliminar workspace"
          description={`Vas a eliminar «${form.name || 'este workspace'}». El endpoint aún no está disponible; esta confirmación solo valida el flujo de UI.`}
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
