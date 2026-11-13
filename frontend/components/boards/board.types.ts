/**
 * Board tal como lo devuelve el API (`GET /organizations/:id/boards`).
 *
 * Endpoints:
 * - `GET  /organizations/:organizationId/boards`
 * - `POST /organizations/:organizationId/boards`
 * - `GET  /boards/:boardId`
 * - `PATCH /boards/:boardId` (name, description) — stub en BoardsProvider
 * - `DELETE /boards/:boardId` — pendiente en BE; stub UI no-op
 *
 * Las fechas llegan como string ISO (JSON); no como `Date`.
 */
export type Board = {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};
