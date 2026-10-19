'use client';

import { useCallback } from 'react';
import { BoardColumn, TaskItem, TaskPriority } from '@/types/board';
import {
  addTaskToColumns,
  replaceOrMoveTask,
  deleteTaskFromColumns,
  duplicateTaskInColumns,
  addColumn,
  renameColumn,
  deleteColumn,
} from './kanbanBoard.utils';

interface UseKanbanHandlersProps {
  columns: BoardColumn[];
  selectedColumnId: string;
  onColumnsChange: (columns: BoardColumn[]) => void;
  onSelectedTaskChange: (task: TaskItem | null) => void;
  onSelectedColumnIdChange: (columnId: string) => void;
}

interface UseKanbanHandlersReturn {
  handleAddTask: (columnId: string, title: string, priority: TaskPriority) => void;
  handleTaskClick: (task: TaskItem, columnId: string) => void;
  handleDuplicateTask: (taskId: string, columnId: string) => void;
  handleSaveTask: (updatedTask: TaskItem, newColumnId: string) => void;
  handleDeleteTask: (taskId: string, columnId: string) => void;
  handleAddColumn: (title: string) => void;
  handleRenameColumn: (columnId: string, title: string) => void;
  handleDeleteColumn: (columnId: string) => void;
}

/**
 * Hook que centraliza todos los handlers del tablero Kanban
 * Cada handler está memoizado para optimización
 * Separa la lógica de eventos de la UI
 */
export function useKanbanHandlers({
  columns,
  selectedColumnId,
  onColumnsChange,
  onSelectedTaskChange,
  onSelectedColumnIdChange,
}: UseKanbanHandlersProps): UseKanbanHandlersReturn {
  /**
   * Agrega una nueva tarea a una columna
   */
  const handleAddTask = useCallback(
    (columnId: string, title: string, priority: TaskPriority) => {
      onColumnsChange(addTaskToColumns(columns, columnId, title, priority));
    },
    [columns, onColumnsChange]
  );

  /**
   * Abre el modal de edición de una tarea
   */
  const handleTaskClick = useCallback((task: TaskItem, columnId: string) => {
    onSelectedTaskChange(task);
    onSelectedColumnIdChange(columnId);
  }, [onSelectedTaskChange, onSelectedColumnIdChange]);

  /**
   * Duplica una tarea dentro de su misma columna.
   */
  const handleDuplicateTask = useCallback((taskId: string, columnId: string) => {
    onColumnsChange(duplicateTaskInColumns(columns, columnId, taskId));
  }, [columns, onColumnsChange]);

  /**
   * Guarda cambios de una tarea y la mueve si cambió de columna
   */
  const handleSaveTask = useCallback(
    (updatedTask: TaskItem, newColumnId: string) => {
      onColumnsChange(
        replaceOrMoveTask(columns, selectedColumnId, newColumnId, updatedTask)
      );
    },
    [columns, selectedColumnId, onColumnsChange]
  );

  /**
   * Elimina una tarea de una columna
   */
  const handleDeleteTask = useCallback((taskId: string, columnId: string) => {
    onColumnsChange(deleteTaskFromColumns(columns, columnId, taskId));
  }, [columns, onColumnsChange]);

  /**
   * Crea una nueva columna con el título recibido desde la UI.
   */
  const handleAddColumn = useCallback((title: string) => {
    onColumnsChange(addColumn(columns, title.trim()));
  }, [columns, onColumnsChange]);

  /**
   * Renombra una columna existente.
   */
  const handleRenameColumn = useCallback((columnId: string, title: string) => {
    onColumnsChange(renameColumn(columns, columnId, title.trim()));
  }, [columns, onColumnsChange]);

  /**
   * Elimina una columna completa del tablero.
   */
  const handleDeleteColumn = useCallback((columnId: string) => {
    onColumnsChange(deleteColumn(columns, columnId));
  }, [columns, onColumnsChange]);

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
