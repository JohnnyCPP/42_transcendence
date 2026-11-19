import { z } from "zod";

export	type	BoardList = {

	id: string;
	boardId: string;

	name: string;
	position: number;

	createdAt: Date;
	updatedAt: Date;
	archivedAt: Date | null;
};

export	type	CreateListInput = {
	
	boardId: string;
	actorUserId: string;

	name: string;
};

export	type	UpdateListInput = {

	listId: string;
	actorUserId: string;

	name?: string;
};

export	type	ReorderListsInput = {

	boardId: string;
	actorUserId: string;
	listIds: string[];
};

export	const	boardListSchema = z.object({

	id: z.string(),
	boardId: z.string(),

	name: z.string(),
	position: z.number().int(),

	createdAt: z.date(),
	updatedAt: z.date(),
	archivedAt: z.date().nullable()
});

export	const	listErrorSchema = z.object({
	error: z.string(),
	message: z.string()
});

export	const	createListDocs = {

	tags: ["Lists"],

	summary: "Create a list on a board",

	description:
		"Creates a new list at the end of the board. " +
		"Requires write access to the board (observer role cannot create lists). " +
		"Returns 404 if the board is not accessible to the caller.",

	params: z.object({ boardId: z.string().min(1) }),

	body: z.object({
		name: z.string().trim().min(1).max(80)
	}),

	response: {
		201: z.object({ list: boardListSchema }).describe("The created list."),
		400: listErrorSchema.describe("Validation error."),
		401: listErrorSchema.describe("Authentication required."),
		404: listErrorSchema.describe("Board not found or not accessible.")
	},

	security: []
} as const;

export	const	listListsDocs = {

	tags: ["Lists"],

	summary: "List the lists of a board",

	description:
		"Returns the non-archived lists of a board, ordered by position, paginated. " +
		"Returns 404 if the board is not accessible to the caller.",

	params: z.object({
		boardId: z.string().min(1)
	}),

	querystring: z.object({
		limit: z.coerce.number().int().min(1).max(100).default(50),
		offset: z.coerce.number().int().min(0).default(0)
	}),

	response: {
		200: z.object({
			lists: z.array(boardListSchema),
			pagination: z.object({
				limit: z.number().int(),
				offset: z.number().int(),
				total: z.number().int()
			})
		}).describe("Paginated list of board lists."),
		401: listErrorSchema.describe("Authentication required."),
		404: listErrorSchema.describe("Board not found or not accessible.")
	},

	security: []
} as const;

export	const	updateListDocs = {

	tags: ["Lists"],

	summary: "Update a list",

	description:
		"Renames a list. Requires write access to the parent board. " +
		"Returns 404 if the list does not exist or is not accessible to the caller.",

	params: z.object({
		listId: z.string().min(1)
	}),

	body: z.object({
		name: z.string().trim().min(1).max(80).optional()
	}),

	response: {
		200: z.object({ list: boardListSchema }).describe("The updated list."),
		400: listErrorSchema.describe("Validation error."),
		401: listErrorSchema.describe("Authentication required."),
		404: listErrorSchema.describe("List not found or not accessible.")
	},

	security: []
} as const;

export	const	reorderListsDocs = {

	tags: ["Lists"],

	summary: "Reorder the lists of a board",

	description:
		"Atomically reorders every non-archived list of a board. " +
		"The `listIds` array must contain every active list of the board exactly once; " +
		"any missing, extra, or duplicate id rejects the whole request with 400 `INVALID_LIST_REORDER`. " +
		"Requires write access to the board.",

	params: z.object({
		boardId: z.string().min(1)
	}),

	body: z.object({
		listIds: z.array(z.string().min(1)).min(1)
	}),

	response: {
		200: z.object({ lists: z.array(boardListSchema) }).describe("The lists after reordering, in the new order."),
		400: listErrorSchema.describe("Invalid reorder payload."),
		401: listErrorSchema.describe("Authentication required."),
		404: listErrorSchema.describe("Board not found or not accessible.")
	},

	security: []
} as const;

export	const	archiveListDocs = {

	tags: ["Lists"],

	summary: "Archive a list",

	description:
		"Soft-archives a list. The list and its cards are excluded from subsequent listings. " +
		"Requires write access to the parent board. " +
		"Returns 404 on a second call because the archived list is no longer readable.",

	params: z.object({
		listId: z.string().min(1)
	}),

	response: {
		200: z.object({ list: boardListSchema }).describe("The archived list."),
		401: listErrorSchema.describe("Authentication required."),
		404: listErrorSchema.describe("List not found, already archived, or not accessible.")
	},

	security: []
} as const;
