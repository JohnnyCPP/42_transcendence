'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ActivityFeed,
  BoardCard,
  DashboardHero,
  VelocityWidget,
} from '@/components/dashboard';
import {
  EmptyState,
  Icon,
  InfoDialog,
  buttonClassName,
  uiStyles,
} from '@/components/ui';
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
          <div className={uiStyles.pageContent}>
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
                      <Icon name="view_cozy" className="text-outline" />
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
                    <EmptyState
                      icon="progress_activity"
                      pulse
                      description="Cargando tableros…"
                    />
                  ) : error ? (
                    <EmptyState
                      icon="error"
                      title="No se pudieron cargar los tableros"
                      description={error}
                      titleClassName="mt-3 text-base font-semibold text-on-surface"
                    />
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
                    <EmptyState
                      icon={searchQuery.trim() ? 'search_off' : 'view_kanban'}
                      title={
                        searchQuery.trim()
                          ? 'No hay tableros para esta búsqueda'
                          : 'Aún no hay tableros en este workspace'
                      }
                      description={
                        searchQuery.trim()
                          ? 'Ajusta el texto de búsqueda o crea un nuevo proyecto.'
                          : 'Crea el primer tablero para empezar a organizar el trabajo.'
                      }
                      titleClassName="mt-3 text-base font-semibold text-on-surface"
                    >
                      <Link
                        href="/projects/new"
                        className={`mt-4 ${buttonClassName({ variant: 'primary', size: 'sm' })}`}
                      >
                        Crear proyecto
                      </Link>
                    </EmptyState>
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
