import {
	archiveCardDocs,
	createCardDocs,
	getCardDocs,
	listCardsDocs,
	moveCardDocs,
	updateCardDocs
} from "./cards.types.js";
import { paginationMetadata } from "../../shared/pagination.js";
import { paginationQuerySchema } from "../../shared/http/pagination.js";
import { requireAuth } from "../authorization/requireAuth.js";
import { z } from "zod";
import type { CardsService } from "./cards.service.js";
import type { FastifyInstance } from "fastify";
import type { SessionsService } from "../sessions/sessions.service.js";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

export	async	function	registerCardRoutes(fastifyInstance: FastifyInstance,
											   cardsService: CardsService,
											   sessionsService: SessionsService)
{
	const	typedApp = fastifyInstance.withTypeProvider<ZodTypeProvider>();

	typedApp.post("/api/v1/lists/:listId/cards", {

		preHandler: requireAuth(sessionsService),
		schema: {
					tags: createCardDocs.tags,
					summary: createCardDocs.summary,
					description: createCardDocs.description,
					params: createCardDocs.params,
					body: createCardDocs.body,
					response: createCardDocs.response,
					security: []
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
					tags: listCardsDocs.tags,
					summary: listCardsDocs.summary,
					description: listCardsDocs.description,
					params: listCardsDocs.params,
					querystring: paginationQuerySchema,
					response: listCardsDocs.response,
					security: []
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
					tags: getCardDocs.tags,
					summary: getCardDocs.summary,
					description: getCardDocs.description,
					params: getCardDocs.params,
					response: getCardDocs.response,
					security: []
		}
	}, async (request) => ({

		card: await cardsService.getCardForUser(request.params.cardId, request.currentUser!.id)
	}));

	typedApp.patch("/api/v1/cards/:cardId", {

		preHandler: requireAuth(sessionsService),
		schema: {
					tags: updateCardDocs.tags,
					summary: updateCardDocs.summary,
					description: updateCardDocs.description,
					params: updateCardDocs.params,
					body: updateCardDocs.body,
					response: updateCardDocs.response,
					security: []
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
					tags: moveCardDocs.tags,
					summary: moveCardDocs.summary,
					description: moveCardDocs.description,
					params: moveCardDocs.params,
					body: moveCardDocs.body,
					response: moveCardDocs.response,
					security: []
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
					tags: archiveCardDocs.tags,
					summary: archiveCardDocs.summary,
					description: archiveCardDocs.description,
					params: archiveCardDocs.params,
					response: archiveCardDocs.response,
					security: []
		}
	}, async (request) => {

		await cardsService.archiveCard({
			cardId: request.params.cardId,
			actorUserId: request.currentUser!.id
		});
		return { ok: true } as const;
	});
}
