export type Board = {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
};

export type CreateBoardInput = {
  organizationId: string;
  actorUserId: string;
  name: string;
  description?: string | null;
};

export type UpdateBoardInput = {
  boardId: string;
  actorUserId: string;
  name?: string;
  description?: string | null;
};
