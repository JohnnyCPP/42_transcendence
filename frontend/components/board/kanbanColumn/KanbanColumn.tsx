'use client';

import React, { useState } from 'react';
import { BoardColumn, TaskItem, TaskPriority } from '@/types/board';
import { ConfirmDialog, TextInputDialog } from '@/components/ui';
import TaskCard from '../TaskCard';
import ColumnHeader from './ColumnHeader';
import AddTaskForm from './AddTaskForm';
import AddTaskButton from './AddTaskButton';
import { useColumnState } from './useColumnState';

interface KanbanColumnProps {
  column: BoardColumn;
  onAddTask: (columnId: string, title: string, priority: TaskPriority) => void;
  onTaskClick: (task: TaskItem, columnId: string) => void;
  onRenameColumn: (columnId: string, title: string) => void;
  onDeleteColumn: (columnId: string) => void;
}

/**
 * Columna del tablero Kanban
 * Orquestrador que combina header, tareas y formulario de agregar
 */
export default function KanbanColumn({
  column,
  onAddTask,
  onTaskClick,
  onRenameColumn,
  onDeleteColumn,
}: KanbanColumnProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [columnTitle, setColumnTitle] = useState(column.title);
  const [columnTitleError, setColumnTitleError] = useState<string | null>(null);

  const {
    isAdding,
    newTitle,
    newPriority,
    setNewTitle,
    setNewPriority,
    startAdding,
    cancelAdding,
    resetForm,
  } = useColumnState();

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setFormError('El título de la tarea es obligatorio.');
      return;
    }
    
    onAddTask(column.id, newTitle.trim(), newPriority);
    setFormError(null);
    resetForm();
  };

  const handleTitleChange = (value: string) => {
    setFormError(null);
    setNewTitle(value);
  };

  const handleCancel = () => {
    setFormError(null);
    cancelAdding();
  };

  const handleStartAdding = () => {
    setFormError(null);
    startAdding();
  };

  const handleOpenRenameDialog = () => {
    setColumnTitle(column.title);
    setColumnTitleError(null);
    setIsRenameDialogOpen(true);
  };

  const handleConfirmRename = () => {
    if (!columnTitle.trim()) {
      setColumnTitleError('El nombre de la columna es obligatorio.');
      return;
    }

    onRenameColumn(column.id, columnTitle);
    setIsRenameDialogOpen(false);
  };

  const handleConfirmDelete = () => {
    onDeleteColumn(column.id);
    setIsDeleteDialogOpen(false);
  };

  const isDoneColumn = column.id === 'col-done';

  return (
    <>
      <div className={`kanban-column ${isDoneColumn ? 'opacity-80' : ''}`}>
        <ColumnHeader
          title={column.title}
          taskCount={column.tasks.length}
          onRename={handleOpenRenameDialog}
          onDelete={() => setIsDeleteDialogOpen(true)}
        />

        <div className="kanban-cards">
          {column.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task, column.id)}
            />
          ))}
        </div>

        <div className="p-2">
          {isAdding ? (
            <AddTaskForm
              title={newTitle}
              priority={newPriority}
              error={formError}
              onTitleChange={handleTitleChange}
              onPriorityChange={setNewPriority}
              onSubmit={handleFormSubmit}
              onCancel={handleCancel}
            />
          ) : (
            <AddTaskButton onClick={handleStartAdding} />
          )}
        </div>
      </div>

      <TextInputDialog
        isOpen={isRenameDialogOpen}
        title="Editar nombre de la columna"
        description="Actualiza el nombre visible de esta columna del board."
        label="Nombre de la columna"
        value={columnTitle}
        error={columnTitleError}
        confirmLabel="Guardar cambios"
        onChange={(value) => {
          if (columnTitleError && value.trim()) {
            setColumnTitleError(null);
          }

          setColumnTitle(value);
        }}
        onConfirm={handleConfirmRename}
        onClose={() => setIsRenameDialogOpen(false)}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Eliminar columna"
        description="Se eliminará esta columna junto con todas sus tareas actuales."
        confirmLabel="Eliminar columna"
        tone="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setIsDeleteDialogOpen(false)}
      />
    </>
  );
}
