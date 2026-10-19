'use client';

import { BoardColumn, BoardFilters, TaskItem, TaskPriority } from '@/types/board';

/**
 * Genera un ID único para una tarea basado en timestamp
 */
export function createTaskId() {
  return `t-${Date.now()}`;
}

/**
 * Agrega una nueva tarea a la columna especificada
 * Función pura que retorna nuevas columnas sin mutar las anteriores
 */
export function addTaskToColumns(
  columns: BoardColumn[],
  columnId: string,
  title: string,
  priority: TaskPriority
): BoardColumn[] {
  return columns.map((column) => {
    if (column.id !== columnId) return column;

    const newTask: TaskItem = {
      id: createTaskId(),
      title,
      priority,
      completed: columnId === 'col-done',
    };

    return { ...column, tasks: [...column.tasks, newTask] };
  });
}

/**
 * Reemplaza o mueve una tarea entre columnas
 * Si la tarea está en la misma columna, solo la actualiza
 * Si cambia de columna, la mueve (quita de origen, agrega a destino)
 */
export function replaceOrMoveTask(
  columns: BoardColumn[],
  sourceColumnId: string,
  targetColumnId: string,
  updatedTask: TaskItem
): BoardColumn[] {
  if (sourceColumnId === targetColumnId) {
    return columns.map((column) => {
      if (column.id !== sourceColumnId) return column;

      return {
        ...column,
        tasks: column.tasks.map((task) =>
          task.id === updatedTask.id ? updatedTask : task
        ),
      };
    });
  }

  return columns.map((column) => {
    if (column.id === sourceColumnId) {
      return {
        ...column,
        tasks: column.tasks.filter((task) => task.id !== updatedTask.id),
      };
    }

    if (column.id === targetColumnId) {
      return {
        ...column,
        tasks: [...column.tasks, updatedTask],
      };
    }

    return column;
  });
}

/**
 * Elimina una tarea de una columna específica
 */
export function deleteTaskFromColumns(
  columns: BoardColumn[],
  columnId: string,
  taskId: string
): BoardColumn[] {
  return columns.map((column) => {
    if (column.id !== columnId) return column;

    return {
      ...column,
      tasks: column.tasks.filter((task) => task.id !== taskId),
    };
  });
}

/**
 * Duplica una tarea dentro de la misma columna con un nuevo id.
 */
export function duplicateTaskInColumns(
  columns: BoardColumn[],
  columnId: string,
  taskId: string
): BoardColumn[] {
  return columns.map((column) => {
    if (column.id !== columnId) return column;

    const sourceTask = column.tasks.find((task) => task.id === taskId);
    if (!sourceTask) return column;

    const duplicatedTask: TaskItem = {
      ...sourceTask,
      id: createTaskId(),
      title: `${sourceTask.title} (copy)`,
    };

    return {
      ...column,
      tasks: [...column.tasks, duplicatedTask],
    };
  });
}

/**
 * Crea una nueva columna con título
 */
export function addColumn(columns: BoardColumn[], title: string): BoardColumn[] {
  return [
    ...columns,
    {
      id: `col-${Date.now()}`,
      title,
      tasks: [],
    },
  ];
}

/**
 * Renombra una columna existente sin modificar sus tareas.
 */
export function renameColumn(
  columns: BoardColumn[],
  columnId: string,
  title: string
): BoardColumn[] {
  return columns.map((column) => {
    if (column.id !== columnId) return column;

    return {
      ...column,
      title,
    };
  });
}

/**
 * Elimina una columna completa junto con sus tareas.
 */
export function deleteColumn(columns: BoardColumn[], columnId: string): BoardColumn[] {
  return columns.filter((column) => column.id !== columnId);
}

/**
 * Filtra las tareas de todas las columnas según un query de búsqueda
 * No modifica las columnas, solo filtra las tareas
 */
export function filterColumnsByQuery(
  columns: BoardColumn[],
  searchQuery: string,
  filters?: BoardFilters
): BoardColumn[] {
  const normalizedQuery = searchQuery.toLowerCase();

  return columns.map((column) => ({
    ...column,
    tasks: column.tasks.filter((task) => {
      const matchesQuery = task.title.toLowerCase().includes(normalizedQuery);
      const matchesPriority =
        !filters || filters.priorities.length === 0 || filters.priorities.includes(task.priority);
      const matchesCompleted =
        !filters || !filters.showCompletedOnly || task.completed === true;

      return matchesQuery && matchesPriority && matchesCompleted;
    }),
  }));
}
