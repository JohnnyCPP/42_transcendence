/**
 * List / Card tal como los serializa el API (JSON).
 *
 * Endpoints (sesión `/api/v1`):
 * - `GET/POST /boards/:boardId/lists`
 * - `PATCH /lists/:listId`
 * - `DELETE /lists/:listId` (archive)
 * - `POST /boards/:boardId/lists/reorder` (BE listo; FE sin UI)
 * - `GET/POST /lists/:listId/cards` (create acepta `priority`)
 * - `GET/PATCH /cards/:cardId` (patch acepta `priority`)
 * - `POST /cards/:cardId/move`
 * - `DELETE /cards/:cardId`
 *
 * Relacionados fuera de este módulo: `GET /boards/:boardId/access`,
 * comentarios `/cards/:cardId/comments`.
 *
 * Las fechas llegan como string ISO; no como `Date`.
 */



export type ApiList = {
  id: string;
  boardId: string;
  name: string;
  position: number;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

import type { TaskPriority } from '@/types/board';

export type ApiCard = {
  id: string;
  listId: string;
  title: string;
  priority: TaskPriority;
  description: string | null;
  position: number;
  dueDate: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};
