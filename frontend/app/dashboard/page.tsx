'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ActivityFeed,
  BoardCard,
  DashboardHero,
  VelocityWidget,
} from '@/components/dashboard';
import { InfoDialog } from '@/components/ui';
import { mapBoardToCard, useBoards } from '@/components/boards';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { RequireActiveOrg, useOrg } from '@/components/org';
import { useAuth } from '@/components/auth';

/**
 * Dashboard de resumen dentro del workspace (org) activo.
 *
 * - Auth: `ProtectedRoute`
 * - Workspace: `RequireActiveOrg`
 * - Boards: `useBoards` (BoardsProvider)
 * - UI card: `mapBoardToCard` adapta cada Board al `BoardCard`
 */
export default function DashboardPage() {
  const { user } = useAuth();
  const { activeOrganization } = useOrg();
  const { boards, isLoading, error } = useBoards();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDialog, setActiveDialog] = useState<'new-task' | null>(null);

  const boardCards = useMemo(
    () => boards.map(mapBoardToCard),
    [boards]
  );

  const filteredBoards = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return boardCards;
    }

    return boardCards.filter((board) =>
      board.title.toLowerCase().includes(normalizedQuery)
    );
  }, [boardCards, searchQuery]);

  return (
    <ProtectedRoute>
      <RequireActiveOrg>
        <AppShell
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenNewTaskModal={() => setActiveDialog('new-task')}
        >
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
            <DashboardHero
              title={`Buenos días, ${user?.name}`}
              subtitle={
                activeOrganization
                  ? `Estado de ${activeOrganization.name}: proyectos y tareas de este espacio.`
                  : 'Este es el estado actual de tus proyectos y tareas para hoy.'
              }
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <section>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[18px] font-semibold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-outline">
                        view_cozy
                      </span>
                      Tableros activos
                    </h3>
                    <Link
                      href="/boards"
                      className="text-primary font-medium text-[13px] hover:underline cursor-pointer"
                    >
                      Ver todos
                    </Link>
                  </div>

                  {isLoading ? (
                    <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest p-8 text-center">
                      <span className="material-symbols-outlined animate-pulse text-[28px] text-outline">
                        progress_activity
                      </span>
                      <p className="mt-3 text-sm text-on-surface-variant">
                        Cargando tableros…
                      </p>
                    </div>
                  ) : error ? (
                    <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest p-8 text-center">
                      <span className="material-symbols-outlined text-[28px] text-outline">
                        error
                      </span>
                      <h4 className="mt-3 text-base font-semibold text-on-surface">
                        No se pudieron cargar los tableros
                      </h4>
                      <p className="mt-2 text-sm text-on-surface-variant">{error}</p>
                    </div>
                  ) : filteredBoards.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {filteredBoards.map((board) => (
                        <BoardCard
                          key={board.href ?? board.title}
                          {...board}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest p-8 text-center">
                      <span className="material-symbols-outlined text-[28px] text-outline">
                        {searchQuery.trim() ? 'search_off' : 'view_kanban'}
                      </span>
                      <h4 className="mt-3 text-base font-semibold text-on-surface">
                        {searchQuery.trim()
                          ? 'No hay tableros para esta búsqueda'
                          : 'Aún no hay tableros en este workspace'}
                      </h4>
                      <p className="mt-2 text-sm text-on-surface-variant">
                        {searchQuery.trim()
                          ? 'Ajusta el texto de búsqueda o crea un nuevo proyecto.'
                          : 'Crea el primer tablero para empezar a organizar el trabajo.'}
                      </p>
                      <Link
                        href="/projects/new"
                        className="mt-4 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-container"
                      >
                        Crear proyecto
                      </Link>
                    </div>
                  )}
                </section>
              </div>

              <div className="space-y-6">
                <VelocityWidget />
                <ActivityFeed />
              </div>
            </div>
          </div>
        </AppShell>

        <InfoDialog
          isOpen={activeDialog === 'new-task'}
          title="Nueva tarea desde dashboard"
          description="Puedes crear tareas directamente desde cada board para mantener el flujo de trabajo por columnas."
          onClose={() => setActiveDialog(null)}
        />
      </RequireActiveOrg>
    </ProtectedRoute>
  );
}
