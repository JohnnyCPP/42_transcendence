import { z } from "zod";
import type { ApiKeysService } from "../apiKeys/apiKeys.service.js";
import type { BoardsService } from "../boards/boards.service.js";
import type { CardsService } from "../cards/cards.service.js";
import type { InMemoryRateLimiter } from "../../shared/http/rateLimit.js";
import type { ListsService } from "../lists/lists.service.js";
import type { PublicApiService } from "../publicApi/publicApi.service.js";
import type { UsersService } from "../users/users.service.js";

export	const	boardSummarySchema = z.object({

	id: z.string(),
	organizationId: z.string(),
	createdByUserId: z.string(),

	name: z.string(),
	description: z.string().nullable(),

	createdAt: z.date(),
	updatedAt: z.date(),
	archivedAt: z.date().nullable()
});

export	const	boardListSchema = z.object({

	id: z.string(),

	name: z.string(),
	position: z.number().int()
});

export	const	cardSummarySchema = z.object({

	id: z.string(),
	listId: z.string(),

	title: z.string(),
	description: z.string().nullable(),
	position: z.number().int(),
	dueDate: z.date().nullable()
});

export	const	boardDetailSchema = boardSummarySchema.extend({
	lists: z.array(boardListSchema),
	cards: z.array(cardSummarySchema)
});

export	const	boardParamsSchema = z.object({
	boardId: z.string().min(1)
});

export	const	createBoardApiSchema = z.object({
	organizationId: z.string().min(1),
	name: z.string().trim().min(2).max(100),
	description: z.string().trim().max(500).optional().nullable()
});

export	const	createCardApiSchema = z.object({

	listId: z.string().min(1),
	title: z.string().trim().min(1).max(200),
	description: z.string().trim().max(5000).optional().nullable(),
	dueDate: z.coerce.date().nullable().optional()
});

export	const	errorSchema = z.object({
	error: z.string(),
	message: z.string()
});

export	const	commonErrors = {

	400: errorSchema.describe("Validation error."),

	401: errorSchema.describe("Missing, malformed, revoked, or unknown API key."),

	403: errorSchema.describe("The API key owner lacks permission for this operation."),

	404: errorSchema.describe("Resource not found or not accessible."),

	429: errorSchema.describe("Rate limit exceeded. Retry after the number of seconds in the Retry-After header.")

} as const;

export	const	listParamsSchema = z.object({
	listId: z.string().min(1)
});

export	const	listSummarySchema = z.object({

	id: z.string(),
	boardId: z.string(),

	name: z.string(),
	position: z.number().int()
});

export	const	paginatedBoardsSchema = z.object({
	boards: z.array(boardSummarySchema),
	pagination: z.object({
		limit: z.number().int(),
		offset: z.number().int(),
		total: z.number().int()
	})
});

export	type	PublicApiDependencies = {
	apiKeysService: ApiKeysService;
	usersService: UsersService;
	boardsService: BoardsService;
	cardsService: CardsService;
	listsService: ListsService;
	publicApiService: PublicApiService;
	rateLimiter: InMemoryRateLimiter;
};

export	const	updateBoardApiSchema = z.object({

	name: z.string().trim().min(2).max(100).optional(),
	description: z.string().trim().max(500).optional().nullable()

}).refine((body) => body.name !== undefined || body.description !== undefined, {

	message: "At least one field must be provided"
});
