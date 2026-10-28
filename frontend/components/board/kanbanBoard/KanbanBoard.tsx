'use client';

import React, { useState } from 'react';
import { mockUsers } from '@/data/mockBoardData';
import { BoardColumn, BoardFilters } from '@/types/board';
import { EmptyState, Icon, TextInputDialog } from '@/components/ui';
import KanbanColumn from '../kanbanColumn';
import TaskModal from '../taskModal/TaskModal';
import { useKanbanState } from './useKanbanState';
import { useKanbanHandlers } from './useKanbanHandlers';

// Props del tablero Kanban.
interface KanbanBoardProps {
  initialColumns: BoardColumn[];
  searchQuery: string;
  filters: BoardFilters;
}

/**
 * Orquestador del tablero Kanban.
 *
 * Une el estado del tablero, los handlers de interacción y las vistas de cada
 * columna. También abre el modal de tarea cuando hay una tarjeta seleccionada.
 */
export default function KanbanBoard({ initialColumns, searchQuery, filters }: KanbanBoardProps) {
  const [isAddColumnDialogOpen, setIsAddColumnDialogOpen] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [newColumnError, setNewColumnError] = useState<string | null>(null);

  // Estado central: columnas, tarea seleccionada y filtrado por texto.
  const {
    columns,
    setColumns,
    selectedTask,
    setSelectedTask,
    selectedColumnId,
    setSelectedColumnId,
    filteredColumns,
  } = useKanbanState(initialColumns, searchQuery, filters);

  // Acciones de interacción sobre el tablero.
  const {
    handleAddTask,
    handleTaskClick,
    handleDuplicateTask,
    handleSaveTask,
    handleDeleteTask,
    handleAddColumn,
    handleRenameColumn,
    handleDeleteColumn,
  } = useKanbanHandlers({
    columns,
    selectedColumnId,
    onColumnsChange: setColumns,
    onSelectedTaskChange: setSelectedTask,
    onSelectedColumnIdChange: setSelectedColumnId,
  });

  const hasVisibleTasks = filteredColumns.some((column) => column.tasks.length > 0);
  const hasSearchQuery = searchQuery.trim().length > 0;

  const handleOpenAddColumnDialog = () => {
    setNewColumnTitle('');
    setNewColumnError(null);
    setIsAddColumnDialogOpen(true);
  };

  const handleCloseAddColumnDialog = () => {
    setIsAddColumnDialogOpen(false);
    setNewColumnError(null);
  };

  const handleConfirmAddColumn = () => {
    if (!newColumnTitle.trim()) {
      setNewColumnError('El nombre de la lista es obligatorio.');
      return;
    }

    handleAddColumn(newColumnTitle);
    handleCloseAddColumnDialog();
  };

  return (
    <div className="kanban-board flex-1">
      {!hasVisibleTasks && hasSearchQuery && (
        <EmptyState
          icon="search_off"
          title="No se encontraron tareas"
          description="Prueba con otra búsqueda o crea una nueva tarea desde el tablero."
          className="w-80 min-w-80 shrink-0 rounded-xl p-6 text-on-surface-variant"
          titleClassName="mt-3 text-base font-semibold text-on-surface"
        />
      )}

      {/* Una columna por cada estado visible después del filtrado. */}
      {filteredColumns.map((column) => (
        <KanbanColumn
          key={column.id}
          column={column}
          onAddTask={handleAddTask}
          onTaskClick={handleTaskClick}
          onDuplicateTask={handleDuplicateTask}
          onDeleteTask={handleDeleteTask}
          onRenameColumn={handleRenameColumn}
          onDeleteColumn={handleDeleteColumn}
        />
      ))}

      {/* Acción para crear una nueva lista/columna. */}
      <button
        onClick={handleOpenAddColumnDialog}
        className="w-70 min-w-70 flex items-center gap-2 p-3 text-on-surface bg-surface-container hover:bg-surface-container-high rounded-lg hover:text-on-surface transition-colors h-fit text-[14px] font-medium cursor-pointer shrink-0"
      >
        <Icon name="add" size="lg" />
        Añadir otra columna
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

      <TextInputDialog
        isOpen={isAddColumnDialogOpen}
        title="Crear nueva lista"
        description="Añade una nueva columna al tablero actual."
        label="Nombre de la lista"
        value={newColumnTitle}
        error={newColumnError}
        placeholder="Ej. Review"
        confirmLabel="Crear lista"
        onChange={(value) => {
          if (newColumnError && value.trim()) {
            setNewColumnError(null);
          }

          setNewColumnTitle(value);
        }}
        onConfirm={handleConfirmAddColumn}
        onClose={handleCloseAddColumnDialog}
      />
    </div>
  );
}




