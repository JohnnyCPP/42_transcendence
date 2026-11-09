import { apiFetch } from '@/lib/apiClient';
import type { BoardColumn } from '@/types/board';
import type { ApiCard, ApiList } from './boardApi.types';
import { buildBoardColumns } from './mapBoardApi';
import type { Board } from '../boards/board.types';

/** Tope del query `limit` del backend (`paginationQuerySchema` max 100). */
const PAGE_LIMIT = 100;

/**
 * Metadata de un board.
 *
 * `GET /boards/:boardId` → sobre `{ board }` (tipo compartido con BoardsProvider).
 */
export async function getBoard(boardId: string): Promise<Board> {
  const data = await apiFetch<{ board: Board }>(`/boards/${boardId}`);
  return data.board;
}
/**
 * Carga lists + cards de un board y las convierte a columnas del Kanban.
 *
 * El API no devuelve el tablero entero de una vez:
 * 1) `GET /boards/:boardId/lists` → `{ lists }`
 * 2) por cada list, `GET /lists/:listId/cards` → `{ cards }` (en paralelo)
 * 3) juntamos todas las cards y `buildBoardColumns` arma `BoardColumn[]`
 *
 * `apiFetch<{ lists: ApiList[] }>` tipa el “sobre” JSON del backend
 * (igual que `{ boards }` en `BoardsProvider`), para poder usar `.lists` / `.cards`.
 *
 * Nota: si una list supera `PAGE_LIMIT` cards, hace falta paginar con `offset`.
 */
export async function getBoardColumns(
  boardId: string
): Promise<BoardColumn[]> {
  // 1) Listas del board (sobre: `{ lists: [...] }`).
  const listData = await apiFetch<{ lists: ApiList[] }>(
    `/boards/${boardId}/lists?limit=${PAGE_LIMIT}&offset=0`
  );

  // 2) Cards de cada lista a la vez. `map` crea una promesa por list;
  //    `Promise.all` espera a que terminen todas (más rápido que un for+await).
  const cardPages = await Promise.all(
    listData.lists.map((list) =>
      apiFetch<{ cards: ApiCard[] }>(
        `/lists/${list.id}/cards?limit=${PAGE_LIMIT}&offset=0`
      )
    )
  );

  // 3) Aplana `[{ cards: [...] }, ...]` → un solo `ApiCard[]`.
  const cards = cardPages.flatMap((page) => page.cards);

  // 4) API → modelo de UI del Kanban.
  return buildBoardColumns(listData.lists, cards);
}

/**
 * Crea una lista en el board.
 *
 * `POST /boards/:boardId/lists` con `{ name }` → sobre `{ list }`.
 * Devuelve el `ApiList` del servidor (incluye `id` y `position` reales).
 */
export async function createList(
  boardId: string,
  name: string
): Promise<ApiList> {
  const data = await apiFetch<{ list: ApiList }>(`/boards/${boardId}/lists`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  return data.list;
}

/**
 * Crea una tarjeta en una lista.
 *
 * `POST /lists/:listId/cards` → sobre `{ card }`.
 * `description` / `dueDate` opcionales; si faltan se envían como `null`
 * (el schema del backend acepta nullable).
 */
export async function createCard(
  listId: string,
  title: string,
  description?: string | null,
  dueDate?: string | null
): Promise<ApiCard> {
  const data = await apiFetch<{ card: ApiCard }>(`/lists/${listId}/cards`, {
    method: 'POST',
    body: JSON.stringify({
      title,
      description: description ?? null,
      dueDate: dueDate ?? null,
    }),
  });
  return data.card;
}

/**
 * Renombra una lista.
 *
 * `PATCH /lists/:listId` con `{ name }` → sobre `{ list }`.
 */
export async function updateList(
  listId: string,
  name: string
): Promise<ApiList> {
  const data = await apiFetch<{ list: ApiList }>(`/lists/${listId}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
  return data.list;
}

/**
 * Actualiza campos de una tarjeta.
 *
 * `PATCH /cards/:cardId` → sobre `{ card }`.
 * El schema del backend es partial; enviamos nullables explícitos.
 */
export async function updateCard(
  cardId: string,
  title: string,
  description?: string | null,
  dueDate?: string | null
): Promise<ApiCard> {
  const data = await apiFetch<{ card: ApiCard }>(`/cards/${cardId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      title,
      description: description ?? null,
      dueDate: dueDate ?? null,
    }),
  });
  return data.card;
}

/**
 * Mueve una tarjeta a otra lista.
 *
 * `POST /cards/:cardId/move` con `{ targetListId }` → sobre `{ card }`.
 */
export async function moveCard(
  cardId: string,
  targetListId: string
): Promise<ApiCard> {
  const data = await apiFetch<{ card: ApiCard }>(`/cards/${cardId}/move`, {
    method: 'POST',
    body: JSON.stringify({ targetListId }),
  });
  return data.card;
}

/**
 * Archiva una tarjeta (soft delete en el backend).
 *
 * `DELETE /cards/:cardId` → `{ ok: true }`.
 * No hay `DELETE /lists/:id` en el API.
 */
export async function deleteCard(cardId: string): Promise<void> {
  await apiFetch<{ ok: true }>(`/cards/${cardId}`, {
    method: 'DELETE',
  });
}
