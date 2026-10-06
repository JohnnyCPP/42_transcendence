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

  const hasVisibleTasks = filteredColumns.some((column) => column.tasks.length > 0);
  const hasSearchQuery = searchQuery.trim().length > 0;

  return (
    <div className="kanban-board flex-1">
      {!hasVisibleTasks && hasSearchQuery && (
        <div className="w-80 min-w-80 rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-6 text-center text-on-surface-variant shrink-0">
          <span className="material-symbols-outlined text-[28px] text-outline">search_off</span>
          <h3 className="mt-3 text-base font-semibold text-on-surface">No se encontraron tareas</h3>
          <p className="mt-2 text-sm">
            Prueba con otra búsqueda o crea una nueva tarea desde el tablero.
          </p>
        </div>
      )}

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
