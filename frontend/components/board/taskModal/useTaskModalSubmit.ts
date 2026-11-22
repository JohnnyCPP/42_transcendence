'use client';

import { useCallback, useState } from 'react';
import { TaskItem, TaskPriority } from '@/types/board';
import { buildUpdatedTask } from './taskModal.utils';
import { User } from '@/types/board';

interface TaskFormData {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
  columnId: string;
  completed: boolean;
  assignedUserIds: string[];
}

interface UseTaskModalSubmitReturn {
  titleError: string | null;
  clearTitleError: () => void;
  saveError: string | null;
  isSaving: boolean;
  handleSubmit: (event: React.FormEvent) => void;
}

/**
 * Hook specializado para manejar la lógica de envío del formulario
 * Separa validación, transformación y callbacks del componente principal
 */
export function useTaskModalSubmit(
  task: TaskItem,
  formData: TaskFormData,
  users: User[],
  onSave: (updatedTask: TaskItem, newColumnId: string) => Promise<void>,
  onClose: () => void
): UseTaskModalSubmitReturn {
  const [titleError, setTitleError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const clearTitleError = useCallback(() => {
    setTitleError(null);
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      if (isSaving) return;

      // Validación
      if (!formData.title.trim()) {
        setTitleError('El título de la tarea es obligatorio.');
        return;
      }

      setTitleError(null);

      // Transformación
      const updatedTask = buildUpdatedTask({
        task,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        dueDate: formData.dueDate,
        completed: formData.completed,
        assignedUserIds: formData.assignedUserIds,
        users,
      });

      setSaveError(null);
      setIsSaving(true);
      try {
        await onSave(updatedTask, formData.columnId);
        onClose();
      } catch {
        setSaveError('No se pudieron guardar los cambios. Inténtalo de nuevo.');
      } finally {
        setIsSaving(false);
      }
    },
    [task, formData, users, onSave, onClose, isSaving]
  );

  return { titleError, clearTitleError, saveError, isSaving, handleSubmit };
}
