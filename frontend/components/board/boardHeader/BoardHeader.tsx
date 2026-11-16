import { BoardFilters, TaskPriority } from '@/types/board';
import { HeaderButtonsList } from './HeaderButtonsList';
import { HeaderTitle } from './HeaderTitle';

interface BoardHeaderProps {
  /** Id del board (para el enlace de compartir y mutaciones). */
  boardId: string;
  /** Nombre del board desde `GET /boards/:id`; null mientras carga. */
  boardTitle: string | null;
  /** Actualiza el título en la página padre tras un rename exitoso. */
  onBoardTitleChange?: (title: string) => void;
  filters: BoardFilters;
  onTogglePriority: (priority: TaskPriority) => void;
  onToggleCompletedOnly: () => void;
  onClearFilters: () => void;
}

/**
 * Cabecera del tablero: título + filtros / compartir / menú de acciones.
 */
export default function BoardHeader({
  boardId,
  boardTitle,
  onBoardTitleChange,
  filters,
  onTogglePriority,
  onToggleCompletedOnly,
  onClearFilters,
}: BoardHeaderProps) {
  return (
    <div className="flex shrink-0 flex-col items-start justify-between gap-4 border-b border-outline-variant bg-surface-container-lowest px-6 py-4 sm:flex-row sm:items-center">
      <HeaderTitle boardTitle={boardTitle} />

      <HeaderButtonsList
        boardId={boardId}
        boardTitle={boardTitle}
        onBoardTitleChange={onBoardTitleChange}
        filters={filters}
        onTogglePriority={onTogglePriority}
        onToggleCompletedOnly={onToggleCompletedOnly}
        onClearFilters={onClearFilters}
      />
    </div>
  );
}
