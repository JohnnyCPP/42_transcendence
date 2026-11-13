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

		try {
			const [board, columns] = await Promise.all([getBoard(boardId), getBoardColumns(boardId)]);
			if (!cancelled) {
				setBoardTitle(board.name);
				setBoardColumns(columns);
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
          onOpenNewTaskModal={handleOpenNewTaskModal}
        >
          <div data-board-id={boardId} className="contents">
            <BoardHeader
              boardId={boardId}
              boardTitle={boardTitle}
              onBoardTitleChange={setBoardTitle}
              filters={boardFilters}
              onTogglePriority={handleTogglePriority}
              onToggleCompletedOnly={handleToggleCompletedOnly}
              onClearFilters={handleClearFilters}
            />

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
