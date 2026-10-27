'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { BoardCard } from '@/components/dashboard';
import { mapBoardToCard, useBoards } from '@/components/boards';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { RequireActiveOrg, useOrg } from '@/components/org';

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
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
            <section className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
                Boards
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-on-surface md:text-4xl">
                Tableros de {activeOrganization?.name ?? 'tu workspace'}
              </h1>
              <p className="max-w-2xl text-sm text-on-surface-variant md:text-base">
                Consulta y abre los tableros de este espacio de trabajo.
              </p>
            </section>

            {isLoading ? (
              <section className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest p-8 text-center">
                <span className="material-symbols-outlined animate-pulse text-[28px] text-outline">
                  progress_activity
                </span>
                <p className="mt-3 text-sm text-on-surface-variant">
                  Cargando tableros…
                </p>
              </section>
            ) : error ? (
              <section className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest p-8 text-center">
                <span className="material-symbols-outlined text-[28px] text-outline">
                  error
                </span>
                <h2 className="mt-3 text-lg font-semibold text-on-surface">
                  No se pudieron cargar los tableros
                </h2>
                <p className="mt-2 text-sm text-on-surface-variant">{error}</p>
              </section>
            ) : filteredBoards.length > 0 ? (
              <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredBoards.map((board) => (
                  <BoardCard key={board.href ?? board.title} {...board} />
                ))}
              </section>
            ) : (
              <section className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest p-8 text-center">
                <span className="material-symbols-outlined text-[28px] text-outline">
                  {searchQuery.trim() ? 'search_off' : 'view_kanban'}
                </span>
                <h2 className="mt-3 text-lg font-semibold text-on-surface">
                  {searchQuery.trim()
                    ? 'No hay boards que coincidan'
                    : 'Aún no hay tableros'}
                </h2>
                <p className="mt-2 text-sm text-on-surface-variant">
                  {searchQuery.trim()
                    ? 'Ajusta la búsqueda del header para encontrar otro board.'
                    : 'Crea el primer tablero de este workspace.'}
                </p>
                {!searchQuery.trim() && (
                  <Link
                    href="/projects/new"
                    className="mt-4 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-container"
                  >
                    Crear proyecto
                  </Link>
                )}
              </section>
            )}
          </div>
        </AppShell>
      </RequireActiveOrg>
    </ProtectedRoute>
  );
}
