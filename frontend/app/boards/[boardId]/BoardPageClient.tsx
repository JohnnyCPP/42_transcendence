'use client';

import { useState, useEffect } from 'react';
import BoardHeader from '@/components/board/boardHeader';
import KanbanBoard from '@/components/board/kanbanBoard/KanbanBoard';
import { getBoard, getBoardColumns } from '@/components/board/boardApi';
import { EmptyState, InfoDialog } from '@/components/ui';
import { BoardColumn, BoardFilters, TaskPriority } from '@/types/board';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { RequireActiveOrg } from '@/components/org';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/apiClient';
import { useRoles, type BoardAccess } from '@/lib/useRoles';

const initialBoardFilters: BoardFilters = {
  priorities: [],
  showCompletedOnly: false,
};

/**
 * Vista de un tablero Kanban por `boardId`.
 *
 * - Exige org/workspace activo (`RequireActiveOrg`).
 * - Carga en paralelo `getBoard` (título) + `getBoardColumns` (lists/cards).
 * - Loading/error con `EmptyState` (mismo patrón que dashboard y `/boards`).
 */
export default function BoardPageClient({ boardId }: { boardId: string }) {
  const router = useRouter();
  const [access, setAccess] = useState<BoardAccess | null>(null);
  const { canWriteBoard, canArchiveBoard } = useRoles(access);
  const [searchQuery, setSearchQuery] = useState('');
  const [isQuickTaskDialogOpen, setIsQuickTaskDialogOpen] = useState(false);
  const [boardFilters, setBoardFilters] = useState<BoardFilters>(initialBoardFilters);

  const [boardColumns, setBoardColumns] = useState<BoardColumn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [boardTitle, setBoardTitle] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;


	async function loadBoard() {

		setIsLoading(true);
		setError(null);
		setAccess(null);

		try {
			const [board, columns, permissions] = await Promise.all([getBoard(boardId), getBoardColumns(boardId), apiFetch<{ access: BoardAccess }>(`/boards/${boardId}/access`)]);
			if (!cancelled) {
				setBoardTitle(board.name);
				setBoardColumns(columns);
				setAccess(permissions.access);
			}
		} catch (err) {
			if (!cancelled) {
				setError(err instanceof Error ? err.message : 'Error al cargar el tablero');
				setBoardTitle(null);
				setBoardColumns([]);
			}
		} finally {
			if (!cancelled) {
				setIsLoading(false);
			}
		}

	}
	void loadBoard();

    return () => {
      cancelled = true;
    };
  }, [boardId]);

  const handleOpenNewTaskModal = () => {
    setIsQuickTaskDialogOpen(true);
  };

  const handleTogglePriority = (priority: TaskPriority) => {
    setBoardFilters((prev) => ({
      ...prev,
      priorities: prev.priorities.includes(priority)
        ? prev.priorities.filter((item) => item !== priority)
        : [...prev.priorities, priority],
    }));
  };

  const handleToggleCompletedOnly = () => {
    setBoardFilters((prev) => ({
      ...prev,
      showCompletedOnly: !prev.showCompletedOnly,
    }));
  };

  const handleClearFilters = () => {
    setBoardFilters(initialBoardFilters);
  };

  return (
    <ProtectedRoute>
      <RequireActiveOrg>
        <AppShell
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenNewTaskModal={canWriteBoard ? handleOpenNewTaskModal : undefined}
        >
          <div data-board-id={boardId} className="contents">
            <BoardHeader
              boardId={boardId}
              boardTitle={boardTitle}
              filters={boardFilters}
              onTogglePriority={handleTogglePriority}
              onToggleCompletedOnly={handleToggleCompletedOnly}
              onClearFilters={handleClearFilters}
            />
            {canArchiveBoard && <button className="self-end mx-6 text-error" onClick={async () => {
              if (!window.confirm('¿Archivar este tablero?')) return;
              try { await apiFetch(`/boards/${boardId}`, { method: 'DELETE' }); router.push('/boards'); }
              catch (e) { setError(e instanceof Error ? e.message : 'No se pudo archivar el tablero'); }
            }}>Eliminar tablero</button>}

            {isLoading ? (
              <EmptyState
                icon="progress_activity"
                pulse
                description="Cargando tablero…"
              />
            ) : error ? (
              <EmptyState
                icon="error"
                title="No se pudo cargar el tablero"
                description={error}
              />
            ) : (
              <KanbanBoard
				canWrite={canWriteBoard}
				boardId={boardId}
                initialColumns={boardColumns}
                searchQuery={searchQuery}
                filters={boardFilters}
              />
            )}
          </div>
        </AppShell>

        <InfoDialog
          isOpen={isQuickTaskDialogOpen}
          title="Crear tarea rápida"
          description="Puedes crear nuevas tareas desde el botón + de cada columna para mantener el flujo dentro del tablero."
          onClose={() => setIsQuickTaskDialogOpen(false)}
        />
      </RequireActiveOrg>
    </ProtectedRoute>
  );
}
