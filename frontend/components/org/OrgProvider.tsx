'use client';

import {
  createContext,
  type ReactNode,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {
  Organization,
  OrganizationWithRole,
  OrgState,
} from './org.types';
import { useAuth } from '../auth';
import { apiFetch } from '@/lib/apiClient';

/**
 * Persiste el workspace activo entre recargas.
 *
 * Clave en `localStorage`. Solo guarda el id (no el objeto completo):
 * al refrescar se vuelve a resolver contra `GET /organizations`.
 */
const ACTIVE_ORG_STORAGE_KEY = 'taskflow.activeOrganizationId';

/** Lee el id guardado. En SSR no hay `window` → `null`. */
function readStoredActiveOrgId(): string | null {
  if (typeof window === 'undefined') return null;
  const storedId = localStorage.getItem(ACTIVE_ORG_STORAGE_KEY);
  return storedId ?? null;
}

/** Escribe el id activo, o borra la clave si `orgId` es `null`. */
function writeStoredActiveOrgId(orgId: string | null): void {
  if (typeof window === 'undefined') return;
  if (orgId === null) {
    localStorage.removeItem(ACTIVE_ORG_STORAGE_KEY);
  } else {
    localStorage.setItem(ACTIVE_ORG_STORAGE_KEY, orgId);
  }
}

/** Atajo de logout / sin sesión. */
function clearStoredActiveOrgId(): void {
  writeStoredActiveOrgId(null);
}

/** Body de `PATCH /organizations/:organizationId`. */
export type UpdateOrganizationInput = {
  name?: string;
  slug?: string;
};

type OrgContextValue = OrgState & {
  refreshOrganizations: () => Promise<void>;
  createOrganization: (name: string, slug?: string) => Promise<void>;
  /**
   * Actualiza nombre/slug del workspace.
   * `PATCH /organizations/:organizationId` → fusiona en state preservando `role`.
   */
  updateOrganization: (
    organizationId: string,
    input: UpdateOrganizationInput
  ) => Promise<void>;
  /**
   * Archiva la org.
   * `DELETE /organizations/:id` → actualiza lista, activo y storage.
   */
  deleteOrganization: (organizationId: string) => Promise<void>;
  setActiveOrganization: (org: OrganizationWithRole) => void;
  clearError: () => void;
};

export const OrgContext = createContext<OrgContextValue | null>(null);

/**
 * Estado global de organizaciones (= “workspace” en la UI).
 *
 * - API: `GET/POST/PATCH/DELETE /organizations`
 * - UI switcher: `/workspace`
 * - Tableros: `/boards` (filtrados por `activeOrganization`)
 *
 * Persistencia del activo:
 * - `setActiveOrganization` / `createOrganization` → escriben el id en localStorage
 * - `refreshOrganizations` → restaura el id guardado si sigue en la lista
 * - Logout (`!isAuthenticated` y auth ya resuelta) → borra la clave
 *
 * Importante: no limpiar storage mientras `isAuthLoading` es true.
 * Auth arranca con `isAuthenticated: false`; si limpiáramos ahí,
 * cada F5 borraría el workspace guardado antes de recuperar la sesión.
 */
export const OrgProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [orgState, setOrgState] = useState<OrgState>({
    organizations: [],
    activeOrganization: null,
    isLoading: true,
    error: null,
  });

  const refreshOrganizations = useCallback(async () => {
    setOrgState((prev) => ({ ...prev, isLoading: true }));

    try {
      const data = await apiFetch<{ organizations: OrganizationWithRole[] }>(
        '/organizations'
      );

      const organizations = data.organizations;
      const storedId = readStoredActiveOrgId();
      const activeOrg =
        organizations.find((org) => org.id === storedId) ??
        organizations[0] ??
        null;

      if (activeOrg) {
        writeStoredActiveOrgId(activeOrg.id);
      } else {
        clearStoredActiveOrgId();
      }

      setOrgState({
        organizations,
        activeOrganization: activeOrg,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error al cargar las organizaciones';
      setOrgState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, []);

  useEffect(() => {
    // Auth aún resolviendo sesión: no tocar storage ni resetear orgs.
    // Si no, con isAuthenticated=false inicial borramos el id guardado en cada F5.
    if (isAuthLoading) {
      return;
    }

    if (!isAuthenticated) {
      clearStoredActiveOrgId();
      setOrgState({
        organizations: [],
        activeOrganization: null,
        isLoading: false,
        error: null,
      });
      return;
    }
    void refreshOrganizations();
  }, [isAuthenticated, isAuthLoading, refreshOrganizations]);

  const createOrganization = useCallback(
    async (name: string, slug?: string) => {
      setOrgState((prev) => ({ ...prev, isLoading: true }));
      try {
        const data = await apiFetch<{ organization: OrganizationWithRole }>(
          '/organizations',
          {
            method: 'POST',
            body: JSON.stringify({ name, slug }),
          }
        );

        setOrgState((prev) => ({
          organizations: [...prev.organizations, data.organization],
          activeOrganization: data.organization,
          isLoading: false,
          error: null,
        }));

        writeStoredActiveOrgId(data.organization.id);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Error al crear la organización';
        setOrgState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    []
  );

  const setActiveOrganization = useCallback((org: OrganizationWithRole) => {
    setOrgState((prev) => ({ ...prev, activeOrganization: org }));
    writeStoredActiveOrgId(org.id);
  }, []);

  /**
   * Actualiza nombre/slug del workspace.
   *
   * `PATCH /organizations/:organizationId`
   * Body: `{ name?, slug? }` → `{ organization }` (sin `role`).
   * Se fusiona en state preservando el `role` local.
   */
  const updateOrganization = useCallback(
    async (
      organizationId: string,
      input: UpdateOrganizationInput
    ): Promise<void> => {
      const data = await apiFetch<{ organization: Organization }>(
        `/organizations/${organizationId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(input),
        }
      );

      setOrgState((prev) => {
        const organizations = prev.organizations.map((org) => {
          if (org.id !== data.organization.id) return org;
          return { ...org, ...data.organization, role: org.role };
        });

        const activeOrganization =
          prev.activeOrganization?.id === data.organization.id
            ? {
                ...prev.activeOrganization,
                ...data.organization,
                role: prev.activeOrganization.role,
              }
            : prev.activeOrganization;

        return { ...prev, organizations, activeOrganization, error: null };
      });
    },
    []
  );

  /**
   * Archiva el workspace.
   *
   * `DELETE /organizations/:organizationId` → `{ ok: true }` (solo owner).
   * Actualiza lista, activo y `localStorage`.
   */
  const deleteOrganization = useCallback(async (organizationId: string) => {
    await apiFetch<{ ok: true }>(`/organizations/${organizationId}`, {
      method: 'DELETE',
    });

    setOrgState((prev) => {
      const organizations = prev.organizations.filter(
        (org) => org.id !== organizationId
      );
      const activeOrganization =
        prev.activeOrganization?.id === organizationId
          ? organizations[0] ?? null
          : prev.activeOrganization;

      writeStoredActiveOrgId(activeOrganization?.id ?? null);

      return { ...prev, organizations, activeOrganization, error: null };
    });
  }, []);

  const clearError = useCallback(() => {
    setOrgState((prev) => ({ ...prev, error: null }));
  }, []);

  const value: OrgContextValue = {
    ...orgState,
    refreshOrganizations,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    setActiveOrganization,
    clearError,
  };

  return (
    <OrgContext.Provider value={value}>{children}</OrgContext.Provider>
  );
};
