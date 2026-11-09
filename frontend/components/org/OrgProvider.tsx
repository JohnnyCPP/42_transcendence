'use client';

import { createContext, type ReactNode, useState, useEffect, useCallback } from 'react';
import { OrganizationWithRole, OrgState } from './org.types';
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

type OrgContextValue = OrgState & {
	refreshOrganizations: () => Promise<void>;
	createOrganization: (name: string, slug?: string) => Promise<void>;
	setActiveOrganization: (org: OrganizationWithRole) => void;
	clearError: () => void;
};

export const OrgContext = createContext<OrgContextValue | null>(null);

/**
 * Estado global de organizaciones (= “workspace” en la UI).
 *
 * - API: `GET/POST /organizations`
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

	const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
	const [orgState, setOrgState] = useState<OrgState>({
		organizations: [],
		activeOrganization: null,
		isLoading: true,
		error: null,
	  });

	const refreshOrganizations = useCallback(async () => {
		setOrgState(prev => ({ ...prev, isLoading: true }));

		try {
			const data = await apiFetch<{ organizations: OrganizationWithRole[] }>('/organizations');

			let organizations = data.organizations;

			if (organizations.length === 0) {
				const createdOrg = await apiFetch<{ organization: OrganizationWithRole }>('/organizations', {
					method: 'POST',
					body: JSON.stringify({
						name: user?.name ? `Organización de ${user.name}` : 'Organización',
					}),
				});

				organizations = [createdOrg.organization];
			}
			const storedId = readStoredActiveOrgId();
			const activeOrg = organizations.find(org => org.id === storedId) ?? organizations[0] ?? null;

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
			const errorMessage = error instanceof Error ? error.message : 'Error al cargar las organizaciones';
			setOrgState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
		}
	}, [user?.name]);

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
		refreshOrganizations();
	}, [isAuthenticated, isAuthLoading, refreshOrganizations]);

	const createOrganization = useCallback(async (name: string, slug?: string) => {
		setOrgState(prev => ({ ...prev, isLoading: true }));
		try {
			const data = await apiFetch<{ organization: OrganizationWithRole }>('/organizations', {
				method: 'POST',
				body: JSON.stringify({ name, slug }),
			});

			setOrgState((prev) => ({
				organizations: [...prev.organizations, data.organization],
				activeOrganization: data.organization,
				isLoading: false,
				error: null,
			}));

			writeStoredActiveOrgId(data.organization.id);

		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error al crear la organización';
			setOrgState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
			throw error;
		}
	}, []);

	const setActiveOrganization = useCallback((org: OrganizationWithRole) => {
		setOrgState(prev => ({ ...prev, activeOrganization: org }));
		writeStoredActiveOrgId(org.id);
	}, []);

	const clearError = useCallback(() => {
		setOrgState(prev => ({ ...prev, error: null }));
	}, []);


	const value: OrgContextValue = {
		...orgState,
		refreshOrganizations,
		createOrganization,
		setActiveOrganization,
		clearError,
	  };

	return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;	
};