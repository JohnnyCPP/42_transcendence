'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LegalLinks from '@/components/layout/LegalLinks';
import { useOrg } from '@/components/org';
import { NavItem, SidebarProps } from './sidebar';

/**
 * Logo TaskFlow + subtítulo con el workspace (org) activo.
 */
function SidebarLogo({ organizationName }: { organizationName?: string | null }) {
  return (
    <div className="px-6 mb-8 flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
        TF
      </div>
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-primary leading-none">TaskFlow</h1>
        <p className="text-[11px] font-medium text-on-surface-variant truncate">
          {organizationName ?? 'Workspace'}
        </p>
      </div>
    </div>
  );
}

/**
 * Navegación lateral persistente de la aplicación.
 *
 * - `/workspace` → switcher de organization (UI: “Workspace”)
 * - `/boards` → listado de tableros (boards del workspace activo)
 */
export default function Sidebar({ isOpenMobile, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { activeOrganization } = useOrg();

  const isDashboardActive = pathname === '/dashboard';
  const isWorkspaceActive =
    pathname === '/workspace' || pathname.startsWith('/workspace/');
  const isBoardsActive =
    pathname === '/boards' || pathname.startsWith('/boards/');

  return (
    <>
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed md:sticky left-0 top-0 z-50 flex flex-col w-60 h-screen bg-surface-bright border-r border-surface-container-highest shadow-sm py-6 transition-transform duration-300 ${
          isOpenMobile
            ? 'translate-x-0'
            : '-translate-x-full md:translate-x-0'
        }`}
      >
        <SidebarLogo organizationName={activeOrganization?.name} />

        <nav className="flex-1 flex flex-col gap-1 px-3">
          <NavItem
            href="/dashboard"
            onClick={onCloseMobile}
            icon="dashboard"
            label="Panel"
            active={isDashboardActive}
            fill={isDashboardActive}
          />

          <NavItem
            href="/workspace"
            onClick={onCloseMobile}
            icon="corporate_fare"
            label="Workspace"
            active={isWorkspaceActive}
            fill={isWorkspaceActive}
          />

          <NavItem
            href="/boards"
            onClick={onCloseMobile}
            icon="view_kanban"
            label="Tableros"
            active={isBoardsActive}
            fill={isBoardsActive}
          />
        </nav>

        <div className="px-3 mt-auto space-y-4">
          <Link
            href="/projects/new"
            onClick={onCloseMobile}
            className="flex w-full items-center justify-center bg-primary text-white text-[13px] font-semibold py-3.5 rounded-xl hover:bg-primary-container transition-colors shadow-xs cursor-pointer active:scale-95"
          >
            Crear proyecto
          </Link>
          <LegalLinks />
        </div>
      </aside>
    </>
  );
}
