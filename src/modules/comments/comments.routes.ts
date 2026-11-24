import {
	cardParamsSchema,
	commentBodySchema,
	commentParamsSchema,
	createCommentDocs,
	deleteCommentDocs,
	listCommentsDocs,
	updateCommentDocs
} from './comments.types.js';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { requireAuth } from '../authorization/requireAuth.js';
import type { SessionsService } from '../sessions/sessions.service.js';
import type { CommentsService } from './comments.service.js';

export async function registerCommentRoutes(app: FastifyInstance, service: CommentsService, sessions: SessionsService) {
  const typed = app.withTypeProvider<ZodTypeProvider>();
  const auth = requireAuth(sessions);

  typed.get('/api/v1/cards/:cardId/comments', { preHandler: auth, schema: { 
		tags: listCommentsDocs.tags,
		summary: listCommentsDocs.summary,
		description: listCommentsDocs.description,
		params: cardParamsSchema,
		response: listCommentsDocs.response,
		security: listCommentsDocs.security
  } },
    async (request) => ({ comments: await service.list(request.params.cardId, request.currentUser!.id) }));

  typed.post('/api/v1/cards/:cardId/comments', { preHandler: auth, schema: { 
			tags: createCommentDocs.tags,
			summary: createCommentDocs.summary,
			description: createCommentDocs.description,
			params: cardParamsSchema,
			body: commentBodySchema,
			response: createCommentDocs.response,
			security: createCommentDocs.security
  } },
    async (request) => ({ comment: await service.create(request.params.cardId, request.currentUser!.id, request.body.content) }));

  typed.patch('/api/v1/cards/:cardId/comments/:commentId', { preHandler: auth, schema: { 
			tags: updateCommentDocs.tags,
			summary: updateCommentDocs.summary,
			description: updateCommentDocs.description,
			params: commentParamsSchema,
			body: commentBodySchema,
			response: updateCommentDocs.response,
			security: updateCommentDocs.security
  } },
    async (request) => ({ comment: await service.update(request.params.cardId, request.params.commentId, request.currentUser!.id, request.body.content) }));

  typed.delete('/api/v1/cards/:cardId/comments/:commentId', { preHandler: auth, schema: { 
			tags: deleteCommentDocs.tags,
			summary: deleteCommentDocs.summary,
			description: deleteCommentDocs.description,
			params: commentParamsSchema,
			response: deleteCommentDocs.response,
			security: deleteCommentDocs.security
  } },
    async (request) => { await service.delete(request.params.cardId, request.params.commentId, request.currentUser!.id); return { ok: true } as const; });
}
