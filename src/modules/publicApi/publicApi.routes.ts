import {
	boardDetailSchema,
	boardParamsSchema,
	boardSummarySchema,
	cardSummarySchema,
	createBoardApiSchema,
	createCardApiSchema,
	commonErrors,
	errorSchema,
	listParamsSchema,
	listSummarySchema,
	paginatedBoardsSchema,
	updateBoardApiSchema
} from "./publicApi.types.js";
import { getRateLimitKey } from "../../shared/http/rateLimit.js";
import { requireApiKey } from "../authorization/requireApiKey.js";
import { z } from "zod";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { PublicApiDependencies } from "./publicApi.types.js";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

/*
 * "dependencies.rateLimiter.consume(apiKey)" checks if the apiKey passed 
 * to it exceeds the amount of requests per unit of time
 *
 * if it's exceeded, throws tooManyRequests()
 *
 * because "rateLimit" runs as a preHandler, every call to any route 
 * defined here is guaranteed to be an authenticated API Key request
 */
export	async	function	registerPublicApiRoutes(fastifyInstance: FastifyInstance,
													dependencies: PublicApiDependencies): Promise<void>
{
	let	typedApp;
	let	rateLimit;
	let	guards;

	typedApp = fastifyInstance.withTypeProvider<ZodTypeProvider>();
	rateLimit = async (request: FastifyRequest, _reply: FastifyReply) => {

		dependencies.rateLimiter.consume(getRateLimitKey("public-api-key", request.currentApiKey!.id));
	};
	guards = [
		requireApiKey(dependencies.apiKeysService, dependencies.usersService),
		rateLimit
	];

	typedApp.get("/api/v1/boards", {

		preHandler: guards,
		schema: {

			tags: ["Boards"],

			summary: "List accessible boards",

			description:
				"Returns every non-archived board the API key owner can access. " +
				"Use `organizationId` to restrict results to a single organization; " +
				"omitting it returns boards across all organizations the owner belongs to.",

			querystring: z.object({
				organizationId: z.string().min(1).optional(),
				limit: z.coerce.number().int().min(1).max(100).default(50),
				offset: z.coerce.number().int().min(0).default(0)
			}),

			response: {
				200: paginatedBoardsSchema.describe("Paginated list of boards."),
				...commonErrors
			}
		}
	}, async (request) => {

		let	organizationId;
		let	limit;
		let	offset;
		let	pagination;
		let	page;

		({ organizationId, limit, offset } = request.query);
		pagination = { limit, offset };
		if (organizationId != null)
		{
			page = await dependencies.boardsService.listOrganizationBoards(organizationId, request.currentUser!.id, pagination);
		}
		else
		{
			page = await dependencies.boardsService.listByUser(request.currentUser!.id, pagination);
		}
		return {
			boards: page.items,
			pagination: {
				limit,
				offset,
				total: page.total
			}
		};
	});

	typedApp.get("/api/v1/boards/:boardId", {

		preHandler: guards,
		schema: {

			tags: ["Boards"],

			summary: "Get a board with its lists and cards",

			description:
				"Returns a board along with all of its active lists and cards. " +
				"Responds with 404 (not 403) when the board is inaccessible, " +
				"to avoid leaking the existence of other users' boards.",

			params: boardParamsSchema,

			response: {
				200: z.object({ board: boardDetailSchema }).describe("Board with nested lists and cards."),
			}
		}
	}, async (request) => {

		let	result;

		result = await dependencies.publicApiService.getBoardWithContents(
			request.params.boardId,
			request.currentUser!.id
		);
		return {
			board: {
				...result.board,
				lists: result.lists,
				cards: result.cards
			}
		};
	});

	typedApp.post("/api/v1/boards", {

		preHandler: guards,
		schema: {
			
			tags: ["Boards"],

			summary: "Create a board",

			description:
				"Creates a board in the given organization. The API key owner must be " +
				"an `owner` or `admin` of that organization. Responds with 404 if the " +
				"organization does not exist or the owner is not a member.",

			body: createBoardApiSchema,

			response: {
				201: z.object({ board: boardSummarySchema }).describe("Board that was created."),
			}
		}
	}, async (request, reply) => {

		let	board;

		board = await dependencies.boardsService.createBoard({

			organizationId: request.body.organizationId,
			actorUserId: request.currentUser!.id,
			name: request.body.name,
			description: request.body.description
		});
		return reply.status(201).send({ board });
	});

	typedApp.put("/api/v1/boards/:boardId", {

		preHandler: guards,
		schema: {

			tags: ["Boards"],

			summary: "Update a board",

			description:
				"Updates a board's name and/or description. Both fields are optional, " +
				"but at least one must be supplied. The API key owner must be a board " +
				"`admin`. Responds with 404 when the board is inaccessible.",

			params: boardParamsSchema,

			body: updateBoardApiSchema,

			response: {
				200: z.object({ board: boardSummarySchema }).describe("Board that was updated."),
			}
		}
	}, async (request) => {

		let	board;

		board = await dependencies.boardsService.updateBoard({

			boardId: request.params.boardId,
			actorUserId: request.currentUser!.id,
			...request.body
		});
		return { board };
	});

	typedApp.delete("/api/v1/boards/:boardId", {

		preHandler: guards,
		schema: {

			tags: ["Boards"],

			summary: "Archive a board",

			description:
				"Archives a board. Archived boards disappear " +
				"from listings and become inaccessible: a second DELETE on the same " +
				"board returns 404 because the board is no longer readable.",

			params: boardParamsSchema,

			response: {
				200: z.object({ board: boardSummarySchema }).describe("Board that was archived."),
			}
		}
	}, async (request) => {

		let	board;

		board = await dependencies.boardsService.archiveBoard(

			request.params.boardId,
			request.currentUser!.id
		);
		return { board };
	});

	typedApp.post("/api/v1/cards", {

		preHandler: guards,
		schema: {

			tags: ["Cards"],

			summary: "Create a card",

			description:
				"Creates a card in the given list. The list id uniquely identifies the " +
				"target list, so the parent board does not need to be supplied. The API " +
				"key owner must have write access to the list.",

			body: createCardApiSchema,

			response: {
				201: z.object({ card: cardSummarySchema }).describe("Card that was created."),
			}
		}
	}, async (request, reply) => {

		const card = await dependencies.cardsService.createCard({

			listId: request.body.listId,
			actorUserId: request.currentUser!.id,

			title: request.body.title,
			description: request.body.description,
			dueDate: request.body.dueDate
		});
		return reply.status(201).send({ card });
	});

	typedApp.delete("/api/v1/lists/:listId", {

		preHandler: guards,
		schema: {

			tags: ["Lists"],

			summary: "Archive a list",

			description:
				"Archives a list and removes it from the board. The API key owner " +
				"must have write access to the list's board. Responds with 404 when the " +
				"list is inaccessible.",

			params: listParamsSchema,

			response: {
				200: z.object({ list: listSummarySchema }).describe("List that was archived."),
			}
		}
	}, async (request) => {

		let	list;

		list = await dependencies.listsService.archiveList(
			request.params.listId,
			request.currentUser!.id
		);
		return { list };
	});
}
