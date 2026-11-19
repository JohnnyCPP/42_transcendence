import { BOARD_ROLES } from "../authorization/roles.js";
import {
	listMyBoardsDocs,
	listOrganizationBoardsDocs,
	createBoardDocs,
	getBoardDocs,
	updateBoardDocs,
	archiveBoardDocs,
	setBoardMemberRoleDocs
} from "./boards.types.js";
import { paginationMetadata } from "../../shared/pagination.js";
import { paginationQuerySchema } from "../../shared/http/pagination.js";
import { requireAuth } from "../authorization/requireAuth.js";
import { z } from "zod";
import type { BoardsService } from "./boards.service.js";
import type { FastifyInstance } from "fastify";
import type { SessionsService } from "../sessions/sessions.service.js";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

export	async	function	registerBoardRoutes(app: FastifyInstance,
											    boardsService: BoardsService,
											    sessionsService: SessionsService)
{
	const	typedApp = app.withTypeProvider<ZodTypeProvider>();

	typedApp.get("/api/v1/boards", {

		preHandler: requireAuth(sessionsService),
		schema: {
					tags: listMyBoardsDocs.tags,
					summary: listMyBoardsDocs.summary,
					description: listMyBoardsDocs.description,
					querystring: listMyBoardsDocs.querystring,
					response: listMyBoardsDocs.response,
					security: []
		}
	}, async (request) => {

		let	page;

		page = await boardsService.listByUser(request.currentUser!.id, request.query);
		return {
			boards: page.items,
			pagination: paginationMetadata(page)
		};
	});

	typedApp.delete("/api/v1/boards/:boardId", {

		preHandler: requireAuth(sessionsService),
		schema: {
					tags: archiveBoardDocs.tags,
					summary: archiveBoardDocs.summary,
					description: archiveBoardDocs.description,
					params: archiveBoardDocs.params,
					response: archiveBoardDocs.response,
					security: []
		}
	}, async (request) => {

		let	board;

		board = await boardsService.archiveBoard(request.params.boardId, request.currentUser!.id);
		return { board };
	});

	typedApp.post("/api/v1/organizations/:organizationId/boards", {

		preHandler: requireAuth(sessionsService),
		schema: {
					tags: createBoardDocs.tags,
					summary: createBoardDocs.summary,
					description: createBoardDocs.description,
					params: createBoardDocs.params,
					body: createBoardDocs.body,
					response: createBoardDocs.response,
					security: []
		}
	}, async (request) => {

		let	params;
		let	body;
		let	board;

		params = request.params;
		body = request.body;
		board = await boardsService.createBoard({

			organizationId: params.organizationId,
			actorUserId: request.currentUser!.id,
			...body
		});
		return { board };
	});

	typedApp.get("/api/v1/organizations/:organizationId/boards", {

		preHandler: requireAuth(sessionsService),
		schema: {
					tags: listOrganizationBoardsDocs.tags,
					summary: listOrganizationBoardsDocs.summary,
					description: listOrganizationBoardsDocs.description,
					params: listOrganizationBoardsDocs.params,
					querystring: listOrganizationBoardsDocs.querystring,
					response: listOrganizationBoardsDocs.response,
					security: []
		}
	}, async (request) => {

		let	params;
		let	page;

		params = request.params;
		page = await boardsService.listOrganizationBoards(params.organizationId, request.currentUser!.id, request.query);
		return {
			boards: page.items,
			pagination: paginationMetadata(page)
		};
	});

	typedApp.get("/api/v1/boards/:boardId", {

		preHandler: requireAuth(sessionsService),
		schema: {
					tags: getBoardDocs.tags,
					summary: getBoardDocs.summary,
					description: getBoardDocs.description,
					params: getBoardDocs.params,
					response: getBoardDocs.response,
					security: []
		}
	}, async (request) => {

		let	params;
		let	board;

		params = request.params;
		board = await boardsService.getByBoardIdAndUserId(params.boardId, request.currentUser!.id);
		return { board };
	});

	typedApp.patch("/api/v1/boards/:boardId", {

		preHandler: requireAuth(sessionsService),
		schema: {
					tags: updateBoardDocs.tags,
					summary: updateBoardDocs.summary,
					description: updateBoardDocs.description,
					params: updateBoardDocs.params,
					body: updateBoardDocs.body,
					response: updateBoardDocs.response,
					security: []
		}
	}, async (request) => {

		let	params;
		let	body;
		let	board;

		params = request.params;
		body = request.body;
		board = await boardsService.updateBoard({

			boardId: params.boardId,
			actorUserId: request.currentUser!.id,
			...body
		});
		return { board };
	});

	typedApp.put("/api/v1/boards/:boardId/members/:userId", {

		preHandler: requireAuth(sessionsService),
		schema: {
					tags: setBoardMemberRoleDocs.tags,
					summary: setBoardMemberRoleDocs.summary,
					description: setBoardMemberRoleDocs.description,
					params: setBoardMemberRoleDocs.params,
					body: setBoardMemberRoleDocs.body,
					response: setBoardMemberRoleDocs.response,
					security: []
		}
	}, async (request) => ({

		member: await boardsService.setBoardMemberRole({

			boardId: request.params.boardId,
			actorUserId: request.currentUser!.id,
			userId: request.params.userId,
			role: request.body.role
		})
	}));
}
