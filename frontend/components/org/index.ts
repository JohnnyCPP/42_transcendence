/**
 * Dominio organización / workspace.
 *
 * Convención de nombres:
 * - UI (rutas, nav, copy) → “workspace” (`/workspace`)
 * - Código y API → “organization” (`OrgProvider`, `/organizations`)
 *
 * Son el mismo concepto; no renombrar el módulo a workspace solo por la UI.
 */
export { OrgProvider } from './OrgProvider';
export { useOrg } from './useOrg';
export { OrganizationCard } from './OrganizationCard';
export { CreateOrganizationForm } from './CreateOrganizationForm';
export { RequireActiveOrg } from './RequireActiveOrg';
