'use client';

import React, { useState } from 'react';
import { BoardColumn, TaskItem, TaskPriority } from '@/types/board';
import TaskCard from '../TaskCard';
import ColumnHeader from './ColumnHeader';
import AddTaskForm from './AddTaskForm';
import AddTaskButton from './AddTaskButton';
import { useColumnState } from './useColumnState';

interface KanbanColumnProps {
  column: BoardColumn;
  onAddTask: (columnId: string, title: string, priority: TaskPriority) => void;
  onTaskClick: (task: TaskItem, columnId: string) => void;
}

/**
 * Columna del tablero Kanban
 * Orquestrador que combina header, tareas y formulario de agregar
 */
export default function KanbanColumn({
  column,
  onAddTask,
  onTaskClick,
}: KanbanColumnProps) {
  const [formError, setFormError] = useState<string | null>(null);

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

  const isDoneColumn = column.id === 'col-done';

  return (
    <div className={`kanban-column ${isDoneColumn ? 'opacity-80' : ''}`}>
      <ColumnHeader title={column.title} taskCount={column.tasks.length} />

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
  );
}
