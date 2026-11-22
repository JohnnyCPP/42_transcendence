/**
 * Board tal como lo devuelve el API.
 *
 * Endpoints:
 * - `GET  /organizations/:organizationId/boards`
 * - `POST /organizations/:organizationId/boards`
 * - `GET  /boards/:boardId`
 * - `PATCH /boards/:boardId` (name, description)
 * - `DELETE /boards/:boardId` (archive; soft-delete en BE)
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
