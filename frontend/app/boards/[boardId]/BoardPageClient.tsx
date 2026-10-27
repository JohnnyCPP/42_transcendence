'use client';

import { useState } from 'react';
import BoardHeader from '@/components/board/boardHeader';
import KanbanBoard from '@/components/board/kanbanBoard/KanbanBoard';
import { initialColumns } from '@/data/mockBoardData';
import { InfoDialog } from '@/components/ui';
import { BoardFilters, TaskPriority } from '@/types/board';
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
 * - Exige org/workspace activo (`RequireActiveOrg`); listas/cards en mock.
 * - El `boardId` de la URL coincide con el id del API de boards.
 */
export default function BoardPageClient({ boardId }: { boardId: string }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isQuickTaskDialogOpen, setIsQuickTaskDialogOpen] = useState(false);
  const [boardFilters, setBoardFilters] = useState<BoardFilters>(initialBoardFilters);

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
              filters={boardFilters}
              onTogglePriority={handleTogglePriority}
              onToggleCompletedOnly={handleToggleCompletedOnly}
              onClearFilters={handleClearFilters}
            />

            <KanbanBoard
              initialColumns={initialColumns}
              searchQuery={searchQuery}
              filters={boardFilters}
            />
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
