import type { BoardColumn } from '@/types/board';
import type { BoardEvent } from '@/lib/useBoardSocket';
import { mapApiCardToTask } from './mapBoardApi';

/**
 * Aplica un evento en tiempo real a las columnas del tablero (Story 5.3).
 *
 * Es idempotente: aplicar el mismo evento dos veces deja el mismo
 * resultado, porque siempre se busca por id antes de insertar. Hace falta
 * porque quien hace un cambio lo recibe por REST y también por WebSocket.
 *
 * Función pura: no modifica `columns`, devuelve columnas nuevas.
 */
export function applyBoardEvent(columns: BoardColumn[], event: BoardEvent): BoardColumn[] {
  switch (event.type) {
    case 'card:created':
    case 'card:updated':
    case 'card:moved': {
      const current = columns.find((column) => column.tasks.some((task) => task.id === event.card.id));
      const previous = current?.tasks.find((task) => task.id === event.card.id);
      // Se conservan los campos solo de UI (checklist, assignees…) que el API no manda.
      const task = { ...previous, ...mapApiCardToTask(event.card) };

      if (!columns.some((column) => column.id === event.card.listId)) return columns;
      // Ya está en su lista: se reemplaza en su sitio para que no salte al final.
      if (current?.id === event.card.listId) {
        return columns.map((column) =>
          column.id === current.id
            ? { ...column, tasks: column.tasks.map((item) => (item.id === task.id ? task : item)) }
            : column
        );
      }
      // Nueva o cambiada de lista: se quita de donde esté y va al final de la
      // lista destino, igual que hace el backend (última posición + 1000).
      return columns.map((column) => {
        const tasks = column.tasks.filter((item) => item.id !== task.id);
        return column.id === event.card.listId ? { ...column, tasks: [...tasks, task] } : { ...column, tasks };
      });
    }
    case 'card:deleted':
      return columns.map((column) => ({
        ...column,
        tasks: column.tasks.filter((task) => task.id !== event.cardId),
      }));
    case 'list:created':
      if (columns.some((column) => column.id === event.list.id)) return columns;
      return [...columns, { id: event.list.id, title: event.list.name, tasks: [] }];
    case 'list:updated':
      return columns.map((column) =>
        column.id === event.list.id ? { ...column, title: event.list.name } : column
      );
    case 'list:deleted':
      return columns.filter((column) => column.id !== event.listId);
  }
}

/**
 * Sustituye las columnas por las recargadas por REST tras reconectar
 * (Story 5.4). Lo que dice el servidor manda, pero cada tarea conserva los
 * campos solo de UI que ya tenía, igual que en `applyBoardEvent`.
 */
export function mergeRefetchedColumns(current: BoardColumn[], fresh: BoardColumn[]): BoardColumn[] {
  const previous = new Map(current.flatMap((column) => column.tasks).map((task) => [task.id, task]));

  return fresh.map((column) => ({
    ...column,
    tasks: column.tasks.map((task) => ({ ...previous.get(task.id), ...task })),
  }));
}
