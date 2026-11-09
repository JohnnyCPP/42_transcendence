'use client';

import { useCallback } from 'react';
import { BoardColumn, TaskItem, TaskPriority } from '@/types/board';
import {
  replaceOrMoveTask,
  deleteTaskFromColumns,
  renameColumn,
  deleteColumn,
} from './kanbanBoard.utils';
import { createCard, createList, updateList, updateCard, moveCard, deleteCard } from '../boardApi';
import { mapApiCardToTask } from '../mapBoardApi';

interface UseKanbanHandlersProps {
  /** Id del board (necesario para `POST /boards/:boardId/lists`). */
  boardId: string;
  columns: BoardColumn[];
  selectedColumnId: string;
  onColumnsChange: (columns: BoardColumn[]) => void;
  onSelectedTaskChange: (task: TaskItem | null) => void;
  onSelectedColumnIdChange: (columnId: string) => void;
}

interface UseKanbanHandlersReturn {
  handleAddTask: (columnId: string, title: string, priority: TaskPriority) => Promise<void>;
  handleTaskClick: (task: TaskItem, columnId: string) => void;
  handleDuplicateTask: (taskId: string, columnId: string) => Promise<void>;
  handleSaveTask: (updatedTask: TaskItem, newColumnId: string) => Promise<void>;
  handleDeleteTask: (taskId: string, columnId: string) => Promise<void>;
  handleAddColumn: (title: string) => Promise<void>;
  handleRenameColumn: (columnId: string, title: string) => Promise<void>;
  handleDeleteColumn: (columnId: string) => void;
}

/**
 * Handlers de interacción del Kanban.
 *
 * Persistidos contra el API:
 * - `handleAddColumn` → `createList`
 * - `handleAddTask` → `createCard` + `mapApiCardToTask`
 * - `handleDuplicateTask` → `createCard` (copia título/desc/dueDate; no hay endpoint duplicate)
 * - `handleRenameColumn` → `updateList`
 * - `handleSaveTask` → `updateCard` (+ `moveCard` si cambia de lista)
 * - `handleDeleteTask` → `deleteCard` (archive en el BE)
 *
 * Aún solo local:
 * - `handleDeleteColumn` (el BE no tiene DELETE list; pendiente de equipo)
 */
export function useKanbanHandlers({
  boardId,
  columns,
  selectedColumnId,
  onColumnsChange,
  onSelectedTaskChange,
  onSelectedColumnIdChange,
}: UseKanbanHandlersProps): UseKanbanHandlersReturn {
  /**
   * Crea una card en el API y la añade a la columna.
   *
   * `columnId` es el id de la list. `priority` lo sigue enviando la UI
   * pero el backend no lo persiste; el mapper pone un default.
   */
  const handleAddTask = useCallback(
    async (
      columnId: string,
      title: string,
      _priority: TaskPriority
    ): Promise<void> => {
      const card = await createCard(columnId, title.trim());
      const newTask = mapApiCardToTask(card);

      onColumnsChange(
        columns.map((column) =>
          column.id === columnId
            ? { ...column, tasks: [...column.tasks, newTask] }
            : column
        )
      );
    },
    [columns, onColumnsChange]
  );

  /**
   * Abre el modal de edición de una tarea.
   */
  const handleTaskClick = useCallback(
    (task: TaskItem, columnId: string) => {
      onSelectedTaskChange(task);
      onSelectedColumnIdChange(columnId);
    },
    [onSelectedTaskChange, onSelectedColumnIdChange]
  );

  /**
   * Duplica creando otra card en el API (no hay endpoint de duplicate).
   *
   * Copia título (+ " (Copy)"), description y dueDate; el id lo da el servidor.
   */
  const handleDuplicateTask = useCallback(
    async (taskId: string, columnId: string): Promise<void> => {
      const source = columns
        .find((c) => c.id === columnId)
        ?.tasks.find((t) => t.id === taskId);
      if (!source) return;

      const card = await createCard(
        columnId,
        `${source.title} (Copy)`,
        source.description ?? null,
        source.dueDate ?? null
      );
      const newTask = mapApiCardToTask(card);

      onColumnsChange(
        columns.map((column) =>
          column.id === columnId
            ? { ...column, tasks: [...column.tasks, newTask] }
            : column
        )
      );
    },
    [columns, onColumnsChange]
  );

  /**
   * Persiste la edición de una card y, si cambia de columna, la mueve.
   *
   * 1) `PATCH /cards/:id` (`updateCard`)
   * 2) si `newColumnId !== selectedColumnId` → `POST .../move` (`moveCard`)
   * 3) actualiza el Kanban con `replaceOrMoveTask` + `mapApiCardToTask`
   */
  const handleSaveTask = useCallback(
    async (
      updatedTask: TaskItem,
      newColumnId: string
    ): Promise<void> => {
      const card = await updateCard( updatedTask.id, updatedTask.title, updatedTask.description, updatedTask.dueDate);
      let newTask = mapApiCardToTask(card);

      if (newColumnId !== selectedColumnId) {
        const movedCard = await moveCard(card.id, newColumnId);
        newTask = mapApiCardToTask(movedCard);
      }

      onColumnsChange(
        replaceOrMoveTask(columns, selectedColumnId, newColumnId, newTask)
      );
    },
    [columns, selectedColumnId, onColumnsChange]
  );

  /**
   * Archiva la card en el API y la quita del Kanban.
   *
   * `DELETE /cards/:cardId` (`deleteCard`) → soft-delete en el backend;
   * luego `deleteTaskFromColumns` actualiza el estado local.
   */
  const handleDeleteTask = useCallback(
    async (taskId: string, columnId: string): Promise<void> => {
      await deleteCard(taskId);
      onColumnsChange(deleteTaskFromColumns(columns, columnId, taskId));
    },
    [columns, onColumnsChange]
  );

  /**
   * Crea una lista en el API y la añade como columna vacía.
   *
   * Usa `list.id` / `list.name` del servidor (no ids locales).
   */
  const handleAddColumn = useCallback(
    async (title: string): Promise<void> => {
      const list = await createList(boardId, title.trim());
      onColumnsChange([
        ...columns,
        { id: list.id, title: list.name, tasks: [] },
      ]);
    },
    [columns, onColumnsChange, boardId]
  );

  /**
   * Renombra la list en el API y actualiza el título de la columna.
   *
   * `PATCH /lists/:listId` → usa `list.name` del servidor en el estado.
   */
  const handleRenameColumn = useCallback(
    async (columnId: string, title: string): Promise<void> => {
      const list = await updateList(columnId, title.trim());
      onColumnsChange(renameColumn(columns, columnId, list.name));
    },
    [columns, onColumnsChange]
  );

  /**
   * Elimina una columna solo en estado local (el API no tiene DELETE list).
   */
  const handleDeleteColumn = useCallback(
    (columnId: string) => {
      onColumnsChange(deleteColumn(columns, columnId));
    },
    [columns, onColumnsChange]
  );

  return {
    handleAddTask,
    handleTaskClick,
    handleDuplicateTask,
    handleSaveTask,
    handleDeleteTask,
    handleAddColumn,
    handleRenameColumn,
    handleDeleteColumn,
  };
}
