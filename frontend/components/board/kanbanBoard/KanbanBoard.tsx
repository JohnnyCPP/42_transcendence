'use client';

import React from 'react';
import { mockUsers } from '@/data/mockBoardData';
import { BoardColumn } from '@/types/board';
import KanbanColumn from '../kanbanColumn';
import TaskModal from '../taskModal/TaskModal';
import { useKanbanState } from './useKanbanState';
import { useKanbanHandlers } from './useKanbanHandlers';

// Props del tablero Kanban.
interface KanbanBoardProps {
  initialColumns: BoardColumn[];
  searchQuery: string;
}

/**
 * Orquestador del tablero Kanban.
 *
 * Une el estado del tablero, los handlers de interacción y las vistas de cada
 * columna. También abre el modal de tarea cuando hay una tarjeta seleccionada.
 */
export default function KanbanBoard({ initialColumns, searchQuery }: KanbanBoardProps) {
  // Estado central: columnas, tarea seleccionada y filtrado por texto.
  const {
    columns,
    setColumns,
    selectedTask,
    setSelectedTask,
    selectedColumnId,
    setSelectedColumnId,
    filteredColumns,
  } = useKanbanState(initialColumns, searchQuery);

  // Acciones de interacción sobre el tablero.
  const {
    handleAddTask,
    handleTaskClick,
    handleSaveTask,
    handleDeleteTask,
    handleAddColumn,
  } = useKanbanHandlers({
    columns,
    selectedColumnId,
    onColumnsChange: setColumns,
    onSelectedTaskChange: setSelectedTask,
    onSelectedColumnIdChange: setSelectedColumnId,
  });

  return (
    <div className="kanban-board flex-1">
      {/* Una columna por cada estado visible después del filtrado. */}
      {filteredColumns.map((column) => (
        <KanbanColumn
          key={column.id}
          column={column}
          onAddTask={handleAddTask}
          onTaskClick={handleTaskClick}
        />
      ))}

      {/* Botón temporal para crear una nueva lista/columna. */}
      <button
        onClick={handleAddColumn}
        className="w-70 min-w-70 flex items-center gap-2 p-3 text-on-surface bg-surface-container hover:bg-surface-container-high rounded-lg hover:text-on-surface transition-colors h-fit text-[14px] font-medium cursor-pointer shrink-0"
      >
        <span className="material-symbols-outlined text-[20px]">add</span>
        Add another list
      </button>

      {/* Modal de detalle y edición de tarea. */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          currentColumnId={selectedColumnId}
          columns={columns}
          users={mockUsers}
          onClose={() => setSelectedTask(null)}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
        />
      )}
    </div>
  );
}
