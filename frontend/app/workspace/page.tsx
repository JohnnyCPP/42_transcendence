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
import { EmptyState, uiStyles } from '@/components/ui';

function WorkspaceHeader() {
  return (
    <section className="space-y-2">
      <p className={uiStyles.pageKicker}>Workspace</p>
      <h1 className={uiStyles.pageTitle}>Tus workspaces</h1>
      <p className={`max-w-2xl ${uiStyles.pageLead}`}>
        Elige el workspace activo. Los tableros y listas dependerán del
        espacio de trabajo seleccionado.
      </p>
    </section>
  );
}

function WorkspaceLoading() {
  return (
    <EmptyState
      icon="progress_activity"
      pulse
      description="Cargando workspaces…"
      className="rounded-xl"
    />
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
        <div className={uiStyles.pageContent}>
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
                  <EmptyState
                    icon="domain_add"
                    title="Aún no tienes workspaces"
                    description="Crea el primero con el formulario de la derecha."
                    className="rounded-xl"
                    titleClassName="mt-3 text-base font-semibold text-on-surface"
                  />
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
