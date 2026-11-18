import { paginationMetadata } from "../../shared/pagination.js";
import { paginationQuerySchema } from "../../shared/http/pagination.js";
import { requireAuth } from "../authorization/requireAuth.js";
import { z } from "zod";
import type { CardsService } from "./cards.service.js";
import type { FastifyInstance } from "fastify";
import type { SessionsService } from "../sessions/sessions.service.js";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

const	listParamsSchema = z.object({
	listId: z.string().min(1)
});

const	cardParamsSchema = z.object({
	cardId: z.string().min(1)
});

const	createCardSchema = z.object({

	title: z.string().trim().min(1).max(200),
	description: z.string().trim().max(5000).optional().nullable(),
	dueDate: z.coerce.date().nullable().optional()
});

const	updateCardSchema = createCardSchema.partial();

const	moveCardSchema = z.object({
	targetListId: z.string().min(1)
});

export	async	function	registerCardRoutes(fastifyInstance: FastifyInstance,
											   cardsService: CardsService,
											   sessionsService: SessionsService)
{
	const	typedApp = fastifyInstance.withTypeProvider<ZodTypeProvider>();

	typedApp.post("/api/v1/lists/:listId/cards", {

		preHandler: requireAuth(sessionsService),
		schema: {
			params: listParamsSchema,
			body: createCardSchema 
		}
	}, async (request) => {

		let	card;

		card = await cardsService.createCard({

			listId: request.params.listId,
			actorUserId: request.currentUser!.id,
			...request.body
		});
		return { card };
	});

	typedApp.get("/api/v1/lists/:listId/cards", {

		preHandler: requireAuth(sessionsService),
		schema: {
			params: listParamsSchema, 
			querystring: paginationQuerySchema 
		}
	}, async (request) => {

		let	page;

		page = await cardsService.listCardsByListId(request.params.listId, request.currentUser!.id, request.query);
		return {
			cards: page.items, 
			pagination: paginationMetadata(page) 
		};
	});

	typedApp.get("/api/v1/cards/:cardId", {

		preHandler: requireAuth(sessionsService),
		schema: {
			params: cardParamsSchema
		}
	}, async (request) => ({

		card: await cardsService.getCardForUser(request.params.cardId, request.currentUser!.id)
	}));

	typedApp.patch("/api/v1/cards/:cardId", {

		preHandler: requireAuth(sessionsService),
		schema: {
			params: cardParamsSchema,
			body: updateCardSchema
		}
	}, async (request) => ({

		card: await cardsService.updateCard({

			cardId: request.params.cardId,
			actorUserId: request.currentUser!.id,
			...request.body
		})
	}));

	typedApp.post("/api/v1/cards/:cardId/move", {

		preHandler: requireAuth(sessionsService),
		schema: {
			params: cardParamsSchema,
			body: moveCardSchema
		}
	}, async (request) => ({

		card: await cardsService.moveCard({

			cardId: request.params.cardId,
			actorUserId: request.currentUser!.id,
			targetListId: request.body.targetListId
		})
	}));

	typedApp.delete("/api/v1/cards/:cardId", {

		preHandler: requireAuth(sessionsService),
		schema: {
			params: cardParamsSchema
		}
	}, async (request) => {

		await cardsService.archiveCard({
			cardId: request.params.cardId,
			actorUserId: request.currentUser!.id
		});
		return { ok: true };
	});
}
