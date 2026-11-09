/**
 * List / Card tal como los serializa el API (JSON).
 *
 * Endpoints:
 * - `GET/POST /boards/:boardId/lists`
 * - `PATCH /lists/:listId`
 * - `POST /boards/:boardId/lists/reorder`
 * - `GET/POST /lists/:listId/cards`
 * - `GET/PATCH /cards/:cardId`
 * - `POST /cards/:cardId/move`
 * - `DELETE /cards/:cardId`
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

export type ApiCard = {
  id: string;
  listId: string;
  title: string;
  description: string | null;
  position: number;
  dueDate: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};
