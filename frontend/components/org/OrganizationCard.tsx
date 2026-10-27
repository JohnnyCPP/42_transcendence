'use client';

import type { OrganizationWithRole } from './org.types';

const ROLE_LABELS: Record<OrganizationWithRole['role'], string> = {
  owner: 'Propietario',
  admin: 'Admin',
  member: 'Miembro',
};

type OrganizationCardProps = {
  organization: OrganizationWithRole;
  isActive: boolean;
  onSelect: (organization: OrganizationWithRole) => void;
};

/**
 * Tarjeta de workspace (organization en API) para listar y elegir la activa.
 */
export function OrganizationCard({
  organization,
  isActive,
  onSelect,
}: OrganizationCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(organization)}
      className={`w-full text-left rounded-xl border p-4 transition-all duration-200 cursor-pointer ${
        isActive
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-surface-container-highest bg-surface-container-lowest hover:border-primary/30 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
              isActive
                ? 'bg-primary text-white'
                : 'bg-surface-container-high text-on-surface'
            }`}
          >
            {organization.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-[16px] font-semibold text-on-surface">
              {organization.name}
            </h3>
            <p className="truncate text-[12px] text-on-surface-variant">
              /{organization.slug}
            </p>
          </div>
        </div>

        {isActive && (
          <span className="shrink-0 rounded-md bg-primary px-2 py-1 text-[10px] font-semibold uppercase text-white">
            Activa
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 text-[12px] text-on-surface-variant">
        <span className="material-symbols-outlined text-[14px]">badge</span>
        <span>{ROLE_LABELS[organization.role]}</span>
      </div>
    </button>
  );
}
