'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useOrg } from './useOrg';

type RequireActiveOrgProps = {
  children: ReactNode;
};

/**
 * Guardia de workspace activo (paralela a `ProtectedRoute`).
 *
 * - `ProtectedRoute` → exige sesión (auth).
 * - `RequireActiveOrg` → exige `activeOrganization` (= workspace en UI).
 *
 * El nombre del componente habla de “Org” porque lee OrgProvider; la ruta
 * de fallback es `/workspace` (nomenclatura de UI).
 *
 * Comportamiento:
 * 1. Mientras OrgProvider carga → spinner.
 * 2. Si al terminar no hay org activa → `replace('/workspace')`.
 * 3. Si hay org → renderiza `children`.
 *
 * Envolver: dashboard, boards, kanban, crear proyecto.
 * No envolver: `/workspace` (ahí se elige/crea el espacio).
 */
export function RequireActiveOrg({ children }: RequireActiveOrgProps) {
  const router = useRouter();
  const { activeOrganization, isLoading } = useOrg();

  useEffect(() => {
    if (isLoading) return;
    if (!activeOrganization) {
      router.replace('/workspace');
    }
  }, [activeOrganization, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <p className="text-on-surface-variant">Cargando espacio de trabajo…</p>
        </div>
      </div>
    );
  }

  // Evita un flash de contenido mientras corre el redirect.
  if (!activeOrganization) {
    return null;
  }

  return <>{children}</>;
}
