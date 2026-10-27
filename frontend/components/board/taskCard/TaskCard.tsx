'use client';

import React, { useState } from 'react';
import { ConfirmDialog } from '@/components/ui';
import { TaskItem, TaskPriority } from '@/types/board';

const priorityLabels: Record<TaskPriority, string> = {
  Low: 'Baja',
  Medium: 'Media',
  Urgent: 'Urgente',
  Enhancement: 'Mejora',
  Complete: 'Completada',
};

// Props de una tarjeta individual.
interface TaskCardProps {
  task: TaskItem;
  isDragging?: boolean;
  onClick?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}

function getBadgeClass(priority: TaskPriority) {
  switch (priority) {
    case 'Urgent':
      return 'bg-error/10 text-error';
    case 'Medium':
      return 'bg-primary/10 text-primary';
    case 'Low':
      return 'bg-surface-container-low text-primary';
    case 'Enhancement':
      return 'bg-surface-container-high text-on-surface-variant';
    case 'Complete':
      return 'bg-secondary-container text-on-secondary-fixed';
    default:
      return 'bg-surface-container-high text-on-surface';
  }
}

function TaskCardHeader({
  priority,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  priority: TaskPriority;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="flex justify-between items-start mb-2">
      <span
        className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase ${getBadgeClass(
          priority
        )}`}
      >
        {priorityLabels[priority]}
      </span>

      <div className="relative">
        <button
          onClick={(event) => {
            event.stopPropagation();
            setIsMenuOpen((prev) => !prev);
          }}
          className="text-outline hover:text-on-surface cursor-pointer"
          aria-label="Acciones de la tarjeta"
        >
          <span className="material-symbols-outlined text-[16px]">
            more_horiz
          </span>
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 top-7 z-20 min-w-36 rounded-xl border border-outline-variant bg-white p-1 shadow-lg">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setIsMenuOpen(false);
                onEdit?.();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-on-surface transition-colors hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Editar tarea
            </button>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setIsMenuOpen(false);
                onDuplicate?.();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-on-surface transition-colors hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-[18px]">content_copy</span>
              Duplicar
            </button>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setIsMenuOpen(false);
                onDelete?.();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-error transition-colors hover:bg-error/10"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              Eliminar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TaskCardTitle({ title, completed }: { title: string; completed?: boolean }) {
  return (
    <h3
      className={`text-[14px] font-medium mb-3 leading-snug ${
        completed ? 'line-through text-on-surface-variant' : 'text-on-surface'
      }`}
    >
      {title}
    </h3>
  );
}

function TaskWireframePreview() {
  return (
    <div className="w-full h-20 bg-surface-container rounded mb-3 border border-outline-variant p-2 flex flex-col gap-1">
      <div className="w-full h-2 bg-outline-variant/30 rounded-full" />
      <div className="flex gap-2 flex-1 mt-1">
        <div className="w-1/4 h-full bg-outline-variant/30 rounded" />
        <div className="w-3/4 h-full bg-surface-container-lowest border border-outline-variant/20 rounded" />
      </div>
    </div>
  );
}

function TaskMetaIcon({ icon }: { icon: string }) {
  return <span className="material-symbols-outlined text-[14px]">{icon}</span>;
}

function TaskMetaItem({
  icon,
  children,
  className = '',
}: {
  icon: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`flex items-center gap-1 text-[12px] ${className}`}>
      <TaskMetaIcon icon={icon} />
      {children}
    </span>
  );
}

function TaskAssignees({
  completed,
  assignees,
}: {
  completed?: boolean;
  assignees?: TaskItem['assignees'];
}) {
  if (!assignees || assignees.length === 0) return null;

  return (
    <div className="flex -space-x-1">
      {assignees.map((assignee) => (
        <img
          key={assignee.id}
          src={assignee.avatar}
          alt={assignee.name}
          title={assignee.name}
          className={`w-6 h-6 rounded-full border border-white ${
            completed ? 'grayscale' : ''
          }`}
        />
      ))}
    </div>
  );
}

function TaskCardMeta({ task }: { task: TaskItem }) {
  const dueDateClass = task.priority === 'Urgent' ? 'text-error' : task.completed ? 'text-primary' : 'text-on-surface-variant';

  return (
    <div className="flex items-center justify-between text-on-surface-variant">
      <div className="flex items-center gap-3">
        {task.dueDate && (
          <TaskMetaItem icon={task.completed ? 'check_circle' : 'schedule'} className={`gap-1 ${dueDateClass}`}>
            {task.dueDate}
          </TaskMetaItem>
        )}

        {task.hasAttachment && !task.dueDate && (
          <TaskMetaItem icon="subject" />
        )}

        {task.checklist && (
          <TaskMetaItem icon="check_box">
            {task.checklist.completed}/{task.checklist.total}
          </TaskMetaItem>
        )}

        {task.commentsCount !== undefined && (
          <TaskMetaItem icon="chat_bubble_outline">
            {task.commentsCount}
          </TaskMetaItem>
        )}
      </div>

      <TaskAssignees completed={task.completed} assignees={task.assignees} />
    </div>
  );
}

export default function TaskCard({ task, isDragging, onClick, onDuplicate, onDelete }: TaskCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  return (
    <>
      <div
        onClick={onClick}
        className={`kanban-card ${task.completed ? 'bg-surface-container-lowest' : 'bg-surface-container'} ${
          isDragging || task.hasWireframePreview ? 'ring-2 ring-primary border-transparent' : ''
        }`}
      >
        <TaskCardHeader
          priority={task.priority}
          onEdit={onClick}
          onDuplicate={onDuplicate}
          onDelete={() => setIsDeleteDialogOpen(true)}
        />

        <TaskCardTitle title={task.title} completed={task.completed} />

        {task.hasWireframePreview && <TaskWireframePreview />}

        <TaskCardMeta task={task} />
      </div>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Eliminar tarea"
        description="Se eliminará esta tarea del board actual."
        confirmLabel="Eliminar"
        tone="danger"
        onConfirm={() => {
          onDelete?.();
          setIsDeleteDialogOpen(false);
        }}
        onClose={() => setIsDeleteDialogOpen(false)}
      />
    </>
  );
}
