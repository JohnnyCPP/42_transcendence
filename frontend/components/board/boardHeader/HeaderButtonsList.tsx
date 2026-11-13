'use client';

import { useState } from 'react';
import { BoardFilters, TaskPriority } from '@/types/board';
import { BoardCardMenu } from '@/components/boards';
import { BoardFilterDialog } from './BoardFilterDialog';
import { BoardShareDialog } from './BoardShareDialog';
import { HeaderButton } from './HeaderButton';

interface HeaderButtonsListProps {
  boardId: string;
  boardTitle: string | null;
  onBoardTitleChange?: (title: string) => void;
  filters: BoardFilters;
  onTogglePriority: (priority: TaskPriority) => void;
  onToggleCompletedOnly: () => void;
  onClearFilters: () => void;
}

/**
 * Botones de la cabecera: filtros, compartir y menú ⋯ (rename/delete).
 *
 * Los dialogs viven en componentes propios; las mutaciones del board en
 * `BoardCardMenu` / `useBoardActions`.
 */
export function HeaderButtonsList({
  boardId,
  boardTitle,
  onBoardTitleChange,
  filters,
  onTogglePriority,
  onToggleCompletedOnly,
  onClearFilters,
}: HeaderButtonsListProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const activeFilterCount =
    filters.priorities.length + (filters.showCompletedOnly ? 1 : 0);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <HeaderButton
          icon="filter_list"
          label={
            activeFilterCount > 0
              ? `Filtros (${activeFilterCount})`
              : 'Filtros'
          }
          onClick={() => setIsFilterOpen(true)}
          active={activeFilterCount > 0}
        />

        <HeaderButton
          icon="person_add"
          label="Compartir"
          onClick={() => setIsShareOpen(true)}
        />

        <BoardCardMenu
          boardId={boardId}
          boardName={boardTitle ?? ''}
          onRenamed={onBoardTitleChange}
          variant="header"
        />
      </div>

      <BoardFilterDialog
        isOpen={isFilterOpen}
        filters={filters}
        onTogglePriority={onTogglePriority}
        onToggleCompletedOnly={onToggleCompletedOnly}
        onClearFilters={onClearFilters}
        onClose={() => setIsFilterOpen(false)}
      />

      <BoardShareDialog
        isOpen={isShareOpen}
        boardId={boardId}
        onClose={() => setIsShareOpen(false)}
      />
    </>
  );
}
