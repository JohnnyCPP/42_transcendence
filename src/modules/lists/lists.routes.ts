import {
	archiveListDocs,
	createListDocs,
	listListsDocs,
	reorderListsDocs,
	updateListDocs
} from "./lists.types.js";
import { paginationMetadata } from "../../shared/pagination.js";
import { paginationQuerySchema } from "../../shared/http/pagination.js";
import { requireAuth } from "../authorization/requireAuth.js";
import { z } from "zod";
import type { FastifyInstance } from "fastify";
import type { ListsService } from "./lists.service.js";
import type { SessionsService } from "../sessions/sessions.service.js";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

export	async	function	registerListRoutes(app: FastifyInstance,
											   listsService: ListsService,
											   sessionsService: SessionsService)
{
	const	typedApp = app.withTypeProvider<ZodTypeProvider>();

	typedApp.post("/api/v1/boards/:boardId/lists", {

		preHandler: requireAuth(sessionsService),
		schema: {
					tags: createListDocs.tags,
					summary: createListDocs.summary,
					description: createListDocs.description,
					params: createListDocs.params,
					body: createListDocs.body,
					response: createListDocs.response,
					security: []
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

	typedApp.get("/api/v1/boards/:boardId/lists", {

		preHandler: requireAuth(sessionsService),
		schema: {
					tags: listListsDocs.tags,
					summary: listListsDocs.summary,
					description: listListsDocs.description,
					params: listListsDocs.params,
					querystring: listListsDocs.querystring,
					response: listListsDocs.response,
					security: []
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

	typedApp.patch("/api/v1/lists/:listId", {

		preHandler: requireAuth(sessionsService),
		schema: {
					tags: updateListDocs.tags,
					summary: updateListDocs.summary,
					description: updateListDocs.description,
					params: updateListDocs.params,
					body: updateListDocs.body,
					response: updateListDocs.response,
					security: []
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

	typedApp.post("/api/v1/boards/:boardId/lists/reorder", {

		preHandler: requireAuth(sessionsService),
		schema: {
					tags: reorderListsDocs.tags,
					summary: reorderListsDocs.summary,
					description: reorderListsDocs.description,
					params: reorderListsDocs.params,
					body: reorderListsDocs.body,
					response: reorderListsDocs.response,
					security: []
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

	typedApp.delete("/api/v1/lists/:listId", {

		preHandler: requireAuth(sessionsService),
		schema: {
					tags: archiveListDocs.tags,
					summary: archiveListDocs.summary,
					description: archiveListDocs.description,
					params: archiveListDocs.params,
					response: archiveListDocs.response,
					security: []
		}
	}, async (request) => {

		let	list;

		list = await listsService.archiveList(request.params.listId, request.currentUser!.id);
		return { list };
	});
}
