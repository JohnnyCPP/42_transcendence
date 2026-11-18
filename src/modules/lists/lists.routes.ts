import { paginationMetadata } from "../../shared/pagination.js";
import { paginationQuerySchema } from "../../shared/http/pagination.js";
import { requireAuth } from "../authorization/requireAuth.js";
import { z } from "zod";
import type { FastifyInstance } from "fastify";
import type { ListsService } from "./lists.service.js";
import type { SessionsService } from "../sessions/sessions.service.js";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

const	createListSchema = z.object({
	name: z.string().trim().min(1).max(80)
});

const	updateListSchema = z.object({
	name: z.string().trim().min(1).max(80).optional()
});

const	reorderListsSchema = z.object({
	listIds: z.array(z.string().min(1)).min(1)
});

const	boardParamsSchema = z.object({
	boardId: z.string().min(1)
});

const	listParamsSchema = z.object({
	listId: z.string().min(1)
});

export	async	function	registerListRoutes(app: FastifyInstance,
											   listsService: ListsService,
											   sessionsService: SessionsService)
{
	const	typedApp = app.withTypeProvider<ZodTypeProvider>();

	typedApp.post("/boards/:boardId/lists", {

		preHandler: requireAuth(sessionsService),
		schema: {
			params: boardParamsSchema,
			body: createListSchema
		}
	}, async (request) => {

		let	params;
		let	body;
		let	list;

		params = request.params;
		body = request.body;
		list = await listsService.createList({

			boardId: params.boardId,
			actorUserId: request.currentUser!.id,
			...body
		});
		return { list };
	});

	typedApp.get("/boards/:boardId/lists", {

		preHandler: requireAuth(sessionsService),
		schema: {
			params: boardParamsSchema,
			querystring: paginationQuerySchema
		}
	}, async (request) => {

		let	params;
		let	page;

		params = request.params;
		page = await listsService.listByBoardId(params.boardId, request.currentUser!.id, request.query);
		return {
			lists: page.items,
			pagination: paginationMetadata(page)
		};
	});

	typedApp.patch("/lists/:listId", {

		preHandler: requireAuth(sessionsService),
		schema: {
			params: listParamsSchema,
			body: updateListSchema
		}
	}, async (request) => {

		let	params;
		let	body;
		let	list;

		params = request.params;
		body = request.body;
		list = await listsService.updateList({

			listId: params.listId,
			actorUserId: request.currentUser!.id,
			...body
		});
		return { list };
	});

	typedApp.post("/boards/:boardId/lists/reorder", {

		preHandler: requireAuth(sessionsService),
		schema: {
			params: boardParamsSchema,
			body: reorderListsSchema
		}
	}, async (request) => {

		let	params;
		let	body;
		let	lists;

		params = request.params;
		body = request.body;
		lists = await listsService.reorderLists({

			boardId: params.boardId,
			actorUserId: request.currentUser!.id,
			listIds: body.listIds
		});
		return { lists };
	});

	typedApp.delete("/lists/:listId", {

		preHandler: requireAuth(sessionsService),
		schema: {
			params: listParamsSchema
		}
	}, async (request) => {

		let	list;

		list = await listsService.archiveList(request.params.listId, request.currentUser!.id);
		return { list };
	});
}
