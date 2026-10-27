'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import {
  CreateOrganizationForm,
  OrganizationCard,
  useOrg,
} from '@/components/org';
import type { OrganizationWithRole } from '@/components/org/org.types';

function WorkspaceHeader() {
  return (
    <section className="space-y-2">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
        Workspace
      </p>
      <h1 className="text-3xl font-bold tracking-tight text-on-surface md:text-4xl">
        Tus workspaces
      </h1>
      <p className="max-w-2xl text-sm text-on-surface-variant md:text-base">
        Elige el workspace activo. Los tableros y listas dependerán del
        espacio de trabajo seleccionado.
      </p>
    </section>
  );
}

function WorkspaceLoading() {
  return (
    <section className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-8 text-center">
      <span className="material-symbols-outlined animate-pulse text-[28px] text-outline">
        progress_activity
      </span>
      <p className="mt-3 text-sm text-on-surface-variant">
        Cargando workspaces…
      </p>
    </section>
  );
}

/**
 * Switcher de workspace.
 *
 * UI: “workspace” (`/workspace`).
 * Código/API: organization (`useOrg`, `GET/POST /organizations`).
 *
 * Al elegir o crear, fija `activeOrganization` y redirige al dashboard.
 * Los tableros (`/boards`) dependen de ese workspace activo.
 */
export default function WorkspacePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const {
    organizations,
    activeOrganization,
    isLoading,
    error,
    createOrganization,
    setActiveOrganization,
    clearError,
  } = useOrg();

  const handleSelect = (organization: OrganizationWithRole) => {
    setActiveOrganization(organization);
    router.push('/dashboard');
  };

  const handleCreate = async (name: string, slug?: string) => {
    clearError();
    await createOrganization(name, slug);
    router.push('/dashboard');
  };

  return (
    <ProtectedRoute>
      <AppShell searchQuery={searchQuery} onSearchChange={setSearchQuery}>
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          <WorkspaceHeader />

          {isLoading && organizations.length === 0 ? (
            <WorkspaceLoading />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <section className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-[18px] font-semibold text-on-surface">
                    Espacios disponibles
                  </h2>
                  {activeOrganization && (
                    <p className="text-[12px] text-on-surface-variant truncate">
                      Activo:{' '}
                      <span className="font-medium text-on-surface">
                        {activeOrganization.name}
                      </span>
                    </p>
                  )}
                </div>

                {organizations.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {organizations.map((organization) => (
                      <OrganizationCard
                        key={organization.id}
                        organization={organization}
                        isActive={activeOrganization?.id === organization.id}
                        onSelect={handleSelect}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-8 text-center">
                    <span className="material-symbols-outlined text-[28px] text-outline">
                      domain_add
                    </span>
                    <h3 className="mt-3 text-base font-semibold text-on-surface">
                      Aún no tienes workspaces
                    </h3>
                    <p className="mt-2 text-sm text-on-surface-variant">
                      Crea el primero con el formulario de la derecha.
                    </p>
                  </div>
                )}
              </section>

              <aside>
                <CreateOrganizationForm
                  isSubmitting={isLoading}
                  error={error}
                  onSubmit={handleCreate}
                />
              </aside>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
