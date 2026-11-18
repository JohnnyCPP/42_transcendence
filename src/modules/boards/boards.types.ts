import type { BoardRole } from "../authorization/roles.js";

export	type	Board = {

  id: string;
  createdByUserId: string;
  organizationId: string;

  name: string;
  description: string | null;

  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
};

export	type	BoardMember = {

  boardId: string;
  userId: string;

  role: BoardRole;

  joinedAt: Date;
};

export	type	CreateBoardInput = {

  organizationId: string;
  actorUserId: string;

  name: string;
  description?: string | null;
};

export	type	UpdateBoardInput = {

  boardId: string;
  actorUserId: string;

  name?: string;
  description?: string | null;
};

export	type	SetBoardMemberInput = {

  boardId: string;
  userId: string;

  role: BoardRole;
};
