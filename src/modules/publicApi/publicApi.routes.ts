import {
	boardParamsSchema,
	boardDetailSchema,
	createBoardApiSchema,
	updateBoardApiSchema,
	boardSummarySchema,
	createCardApiSchema,
	cardSummarySchema,
	paginatedBoardsSchema
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
			querystring: z.object({
				organizationId: z.string().min(1).optional(),
				limit: z.coerce.number().int().min(1).max(100).default(50),
				offset: z.coerce.number().int().min(0).default(0)
			}),
			response: {
				200: paginatedBoardsSchema
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
			params: boardParamsSchema,
			response: {
				200: z.object({
					board: boardDetailSchema
				})
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
			body: createBoardApiSchema,
			response: {
				201: z.object({
					board: boardSummarySchema
				})
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
			params: boardParamsSchema,
			body: updateBoardApiSchema,
			response: {
				200: z.object({
					board: boardSummarySchema
				})
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
			params: boardParamsSchema,
			response: {
				200: z.object({
					board: boardSummarySchema
				})
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
			body: createCardApiSchema,
			response: {
				201: z.object({
					card: cardSummarySchema
				})
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
			params: z.object({ listId: z.string().min(1) }),
			response: {
				200: z.object({
					list: z.object({
						id: z.string(),
						boardId: z.string(),
						name: z.string(),
						position: z.number().int()
					})
				})
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
