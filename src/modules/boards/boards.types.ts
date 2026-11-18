import { BOARD_ROLES } from "../authorization/roles.js";
import { z } from "zod";
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

export	const	boardSchema = z.object({

	id: z.string(),
	createdByUserId: z.string(),
	organizationId: z.string(),

	name: z.string(),
	description: z.string().nullable(),

	createdAt: z.date(),
	updatedAt: z.date(),
	archivedAt: z.date().nullable()
});

export	const	boardMemberSchema = z.object({

	boardId: z.string(),
	userId: z.string(),

	role: z.enum(BOARD_ROLES),

	joinedAt: z.date()
});

export	const	paginationSchema = z.object({

	limit: z.number().int(),
	offset: z.number().int(),
	total: z.number().int()
});

export	const	boardErrorSchema = z.object({
	error: z.string(),
	message: z.string()
});

export	const	listMyBoardsDocs = {

	tags: ["Boards"],

	summary: "List boards you can access",

	description:
		"Returns all non-archived boards across every organization the authenticated user belongs to. " +
		"Results are paginated and ordered newest first.",

	security: [],

	querystring: z.object({
		limit: z.coerce.number().int().min(1).max(100).default(50),
		offset: z.coerce.number().int().min(0).default(0)
	}),

	response: {
		200: z.object({
			boards: z.array(boardSchema),
			pagination: paginationSchema
		}).describe("Paginated list of boards."),
		401: boardErrorSchema.describe("Authentication required")
	}
} as const;

export	const	listOrganizationBoardsDocs = {

	tags: ["Boards"],

	summary: "List boards in an organization",

	description:
		"Returns the non-archived boards that belong to the given organization. " +
		"The caller must be a member of the organization. " +
		"Returns 404 if the organization does not exist or the caller is not a member.",

	security: [],

	params: z.object({
		organizationId: z.string().min(1)
	}),

	querystring: z.object({
		limit: z.coerce.number().int().min(1).max(100).default(50),
		offset: z.coerce.number().int().min(0).default(0)
	}),

	response: {
		200: z.object({
			boards: z.array(boardSchema),
			pagination: paginationSchema
		}).describe("Paginated list of boards."),
		401: boardErrorSchema.describe("Authentication required."),
		404: boardErrorSchema.describe("Organization not found or not accessible.")
	}
} as const;

export	const	createBoardDocs = {

	tags: ["Boards"],

	summary: "Create a board in an organization",

	description:
		"Creates a board inside the given organization. The caller must have owner or admin role " +
		"in the organization. The caller becomes an admin member of the new board automatically. " +
		"Returns 404 if the organization is not accessible, 403 if the caller lacks the required role.",

	security: [],

	params: z.object({
		organizationId: z.string().min(1)
	}),

	body: z.object({
		name: z.string().trim().min(2).max(100),
		description: z.string().trim().max(500).optional().nullable()
	}),

	response: {
		201: z.object({ board: boardSchema }).describe("The created board."),
		400: boardErrorSchema.describe("Validation error."),
		401: boardErrorSchema.describe("Authentication required."),
		403: boardErrorSchema.describe("Organization admin role required."),
		404: boardErrorSchema.describe("Organization not found or not accessible.")
	}
} as const;

export	const	getBoardDocs = {

	tags: ["Boards"],

	summary: "Get a board by id",

	description:
		"Returns a single board by its id. The caller must have access to the board through the " +
		"organization membership chain. Returns 404 if the board does not exist or is not accessible.",

	security: [],

	params: z.object({
		boardId: z.string().min(1)
	}),

	response: {
		200: z.object({ board: boardSchema }).describe("The requested board."),
		401: boardErrorSchema.describe("Authentication required."),
		404: boardErrorSchema.describe("Board not found or not accessible.")
	}
} as const;

export	const	updateBoardDocs = {

	tags: ["Boards"],

	summary: "Update a board",

	description:
		"Updates the board's name and/or description. The caller must be a board admin. " +
		"Returns 404 if the board is not accessible, 403 if the caller lacks admin rights.",

	security: [],

	params: z.object({
		boardId: z.string().min(1)
	}),

	body: z.object({
		name: z.string().trim().min(2).max(100).optional(),
		description: z.string().trim().max(500).optional().nullable()
	}),

	response: {
		200: z.object({ board: boardSchema }).describe("The updated board."),
		400: boardErrorSchema.describe("Validation error."),
		401: boardErrorSchema.describe("Authentication required."),
		403: boardErrorSchema.describe("Board admin role required."),
		404: boardErrorSchema.describe("Board not found or not accessible.")
	}
} as const;

export	const	archiveBoardDocs = {

	tags: ["Boards"],

	summary: "Archive a board",

	description:
		"Soft-archives the board by setting `archivedAt`. The board stops appearing in listings and " +
		"becomes unreachable (subsequent `GET` returns 404). The caller must be a board admin. " +
		"Archiving an already-archived board returns 404, because the board is no longer readable.",

	security: [],

	params: z.object({
		boardId: z.string().min(1)
	}),

	response: {
		200: z.object({ board: boardSchema }).describe("The archived board."),
		401: boardErrorSchema.describe("Authentication required."),
		403: boardErrorSchema.describe("Board admin role required."),
		404: boardErrorSchema.describe("Board not found or not accessible.")
	}
} as const;

export	const	setBoardMemberRoleDocs = {

	tags: ["Boards"],

	summary: "Set a board member's role",

	description:
		"Sets or updates the role of a user on the board. The caller must be a board admin, " +
		"and the target user must already be a member of the board's organization. " +
		"Valid roles: `observer`, `member`, `admin`.",

	security: [],

	params: z.object({
		boardId: z.string().min(1),
		userId: z.string().min(1)
	}),

	body: z.object({
		role: z.enum(BOARD_ROLES)
	}),

	response: {
		200: z.object({ member: boardMemberSchema }).describe("The board member record."),
		400: boardErrorSchema.describe("Invalid role."),
		401: boardErrorSchema.describe("Authentication required."),
		403: boardErrorSchema.describe("Board admin role required."),
		404: boardErrorSchema.describe("Board or user not accessible.")
	}
} as const;
