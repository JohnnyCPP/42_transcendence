import { TaskPriority } from '@/types/board';

export const priorityOptions: TaskPriority[] = ['Low', 'Medium', 'Urgent', 'Enhancement', 'Complete'];
export const priorityLabels: Record<TaskPriority, string> = {
  Low: 'Baja',
  Medium: 'Media',
  Urgent: 'Urgente',
  Enhancement: 'Mejora',
  Complete: 'Completada',
};