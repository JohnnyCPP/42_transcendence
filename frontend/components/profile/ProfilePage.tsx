'use client';

import { useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import type { AuthUser } from '@/components/auth';
import {
  Button,
  FormErrorBanner,
  Icon,
  TextInput,
  buttonClassName,
  uiStyles,
} from '@/components/ui';
import { useProfileForm } from './useProfileForm';

const ROLE_LABELS: Record<string, string> = {
  user: 'Usuario',
  moderator: 'Moderador',
  admin: 'Administrador',
};

function ProfileHeader() {
  return (
    <section className="space-y-2">
      <p className={uiStyles.pageKicker}>Cuenta</p>
      <h1 className={uiStyles.pageTitle}>Mi perfil</h1>
      <p className={`max-w-2xl ${uiStyles.pageLead}`}>
        Consulta tus datos de cuenta y actualiza el nombre visible o el correo.
        El username no se puede cambiar desde aquí.
      </p>
      <Link
        href="/settings"
        className={buttonClassName({ variant: 'ghost', size: 'sm' })}
      >
        <Icon name="security" size="sm" />
        Ir a ajustes de seguridad
      </Link>
    </section>
  );
}

function ProfileAvatar({ user }: { user: AuthUser }) {
  const displayName = user.name || user.username || 'Usuario';
  const initial = displayName.charAt(0).toUpperCase();
  const roleLabel = user.role
    ? (ROLE_LABELS[user.role] ?? user.role)
    : null;

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div
        className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-outline-variant bg-primary/10 text-xl font-semibold text-primary"
        aria-hidden={!user.avatar}
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={`Avatar de ${displayName}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <span>{initial}</span>
        )}
      </div>
      <div className="min-w-0 space-y-1">
        <p className="truncate text-lg font-semibold text-on-surface">
          {displayName}
        </p>
        <p className="truncate text-sm text-on-surface-variant">
          @{user.username}
        </p>
        {roleLabel && (
          <p className="text-xs font-medium uppercase tracking-wide text-on-surface-variant">
            Rol: {roleLabel}
          </p>
        )}
      </div>
    </div>
  );
}

interface ProfileFormProps {
  form: ReturnType<typeof useProfileForm>;
}

/**
 * Formulario de perfil: avatar + rol, username solo lectura, displayName / email.
 */
export function ProfileForm({ form }: ProfileFormProps) {
  if (!form.user) {
    return (
      <p className="text-sm text-on-surface-variant">
        Cargando datos de la sesión…
      </p>
    );
  }

  return (
    <form
      onSubmit={form.handleSave}
      className={`max-w-xl space-y-5 ${uiStyles.surfaceCard}`}
    >
      <ProfileAvatar user={form.user} />

      <TextInput
        id="profile-username"
        name="username"
        label="Username"
        value={form.user.username}
        disabled
        onChange={() => undefined}
        placeholder="username"
      />

      <TextInput
        id="profile-display-name"
        name="displayName"
        label="Nombre visible"
        value={form.displayName}
        disabled={form.isSaving}
        onChange={form.setDisplayName}
        placeholder="Tu nombre"
      />

      <TextInput
        id="profile-email"
        name="email"
        type="email"
        label="Correo"
        value={form.email}
        disabled={form.isSaving}
        onChange={form.setEmail}
        placeholder="tu@correo.com"
      />

      <FormErrorBanner error={form.error} />

      {form.success && <p className={uiStyles.infoCallout}>{form.success}</p>}

      <div className="flex flex-wrap gap-2 pt-2">
        <Button
          type="submit"
          variant="primary"
          disabled={form.isSaving}
          className="gap-2"
        >
          {form.isSaving && (
            <Icon name="hourglass_empty" size="md" className="animate-spin" />
          )}
          {form.isSaving ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  );
}

/**
 * Página de perfil del usuario autenticado (`/profile`).
 *
 * Persistencia: `PATCH /me` (contrato FE; BE self-service pendiente).
 */
export function ProfilePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const form = useProfileForm();

  return (
    <ProtectedRoute>
      <AppShell searchQuery={searchQuery} onSearchChange={setSearchQuery}>
        <div className={`${uiStyles.pageContent} space-y-8`}>
          <ProfileHeader />
          <ProfileForm form={form} />
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
