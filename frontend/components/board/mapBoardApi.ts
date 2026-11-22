import type { BoardColumn, TaskItem } from '@/types/board';
import type { ApiCard, ApiList } from './boardApi.types';

/**
 * Adaptador API → UI para una tarjeta.
 *
 * Los campos persistidos se obtienen del backend; otros datos de UI
 * como assignees o checklist todavía no forman parte de esta respuesta.
 */
export function mapApiCardToTask(apiCard: ApiCard): TaskItem {
  return {
    id: apiCard.id,
    title: apiCard.title,
    description: apiCard.description ?? undefined,
    dueDate: apiCard.dueDate ?? undefined,
    priority: apiCard.priority,
  };
}

/**
 * Adaptador API → UI para una lista/columna.
 *
 * `ApiList` no trae cards embebidas: se reciben aparte, se filtran por
 * `listId`, se ordenan por `position` y se convierten a `TaskItem`.
 */
export function mapApiListToColumn(
  apiList: ApiList,
  cards: ApiCard[]
): BoardColumn {
  const tasks = cards
    .filter((card) => card.listId === apiList.id)
    .sort((a, b) => a.position - b.position)
    .map(mapApiCardToTask);

  return {
    id: apiList.id,
    title: apiList.name,
    tasks,
  };
}

/**
 * Monta el tablero completo a partir de lists + cards del API.
 *
 * Ordena las listas por `position` (no por nombre) y delega cada columna
 * en `mapApiListToColumn`.
 */
export function buildBoardColumns(
  apiLists: ApiList[],
  cards: ApiCard[]
): BoardColumn[] {
  return [...apiLists]
    .sort((a, b) => a.position - b.position)
    .map((list) => mapApiListToColumn(list, cards));
}
