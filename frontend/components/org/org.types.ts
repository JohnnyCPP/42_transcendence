/**
 * Tipos del recurso organization (API/DB).
 *
 * En la interfaz de usuario este mismo concepto se muestra como “workspace”.
 * Los nombres de campos (`organizations`, `organizationId`, …) siguen al backend.
 */

export type OrganizationRole = 'owner' | 'admin' | 'member';

export type Organization = {
  id: string;
  name: string;
  slug: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type OrganizationWithRole = Organization & {
  role: OrganizationRole;
};

export type OrgState = {
	organizations: OrganizationWithRole[];
	/** Workspace activo en la UI. */
	activeOrganization: OrganizationWithRole | null;
	isLoading: boolean;
	error: string | null;
  };