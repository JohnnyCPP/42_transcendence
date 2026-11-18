import { BOARD_ROLES } from "../authorization/roles.js";
import { paginationMetadata } from "../../shared/pagination.js";
import { paginationQuerySchema } from "../../shared/http/pagination.js";
import { requireAuth } from "../authorization/requireAuth.js";
import { z } from "zod";
import type { BoardsService } from "./boards.service.js";
import type { FastifyInstance } from "fastify";
import type { SessionsService } from "../sessions/sessions.service.js";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

const	createBoardSchema = z.object({
	name: z.string().trim().min(2).max(100),
	description: z.string().trim().max(500).optional().nullable()
});

const	updateBoardSchema = z.object({
	name: z.string().trim().min(2).max(100).optional(),
	description: z.string().trim().max(500).optional().nullable()
});

const	organizationParamsSchema = z.object({
	organizationId: z.string().min(1)
});

const	boardParamsSchema = z.object({
	boardId: z.string().min(1)
});

const	boardMemberParamsSchema = z.object({
	boardId: z.string().min(1),
	userId: z.string().min(1)
});

const	boardMemberSchema = z.object({
	role: z.enum(BOARD_ROLES)
});

export	async	function	registerBoardRoutes(app: FastifyInstance,
											    boardsService: BoardsService,
											    sessionsService: SessionsService)
{
	const	typedApp = app.withTypeProvider<ZodTypeProvider>();

	typedApp.get("/api/v1/boards", {

		preHandler: requireAuth(sessionsService),
		schema: {
			querystring: paginationQuerySchema
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
			params: boardParamsSchema
		}
	}, async (request) => {

		let	board;

		board = await boardsService.archiveBoard(request.params.boardId, request.currentUser!.id);
		return { board };
	});

	typedApp.post("/api/v1/organizations/:organizationId/boards", {

		preHandler: requireAuth(sessionsService),
		schema: {
			params: organizationParamsSchema,
			body: createBoardSchema
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
			params: organizationParamsSchema,
			querystring: paginationQuerySchema
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
			params: boardParamsSchema
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
			params: boardParamsSchema,
			body: updateBoardSchema
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
			params: boardMemberParamsSchema,
			body: boardMemberSchema
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
