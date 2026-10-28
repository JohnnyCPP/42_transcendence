'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { BoardCard } from '@/components/dashboard';
import { mapBoardToCard, useBoards } from '@/components/boards';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { RequireActiveOrg, useOrg } from '@/components/org';
import {
  EmptyState,
  buttonClassName,
  uiStyles,
} from '@/components/ui';

/**
 * Listado completo de boards (tableros) de la organización activa.
 *
 * Misma fuente que el dashboard (`useBoards` / BoardsProvider).
 */
export default function BoardsPage() {
  const { activeOrganization } = useOrg();
  const { boards, isLoading, error } = useBoards();
  const [searchQuery, setSearchQuery] = useState('');

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
  }, [searchQuery, boardCards]);

  return (
    <ProtectedRoute>
      <RequireActiveOrg>
        <AppShell searchQuery={searchQuery} onSearchChange={setSearchQuery}>
          <div className={uiStyles.pageContent}>
            <section className="space-y-2">
              <p className={uiStyles.pageKicker}>Boards</p>
              <h1 className={uiStyles.pageTitle}>
                Tableros de {activeOrganization?.name ?? 'tu workspace'}
              </h1>
              <p className={`max-w-2xl ${uiStyles.pageLead}`}>
                Consulta y abre los tableros de este espacio de trabajo.
              </p>
            </section>

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
              />
            ) : filteredBoards.length > 0 ? (
              <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredBoards.map((board) => (
                  <BoardCard key={board.href ?? board.title} {...board} />
                ))}
              </section>
            ) : (
              <EmptyState
                icon={searchQuery.trim() ? 'search_off' : 'view_kanban'}
                title={
                  searchQuery.trim()
                    ? 'No hay boards que coincidan'
                    : 'Aún no hay tableros'
                }
                description={
                  searchQuery.trim()
                    ? 'Ajusta la búsqueda del header para encontrar otro board.'
                    : 'Crea el primer tablero de este workspace.'
                }
              >
                {!searchQuery.trim() && (
                  <Link
                    href="/projects/new"
                    className={`mt-4 ${buttonClassName({ variant: 'primary', size: 'sm' })}`}
                  >
                    Crear proyecto
                  </Link>
                )}
              </EmptyState>
            )}
          </div>
        </AppShell>
      </RequireActiveOrg>
    </ProtectedRoute>
  );
}
