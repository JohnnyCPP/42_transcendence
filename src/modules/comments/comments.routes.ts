import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { requireAuth } from '../authorization/requireAuth.js';
import type { SessionsService } from '../sessions/sessions.service.js';
import type { CommentsService } from './comments.service.js';

const cardParams = z.object({ cardId: z.string().min(1) });
const commentParams = cardParams.extend({ commentId: z.string().min(1) });
const body = z.object({ content: z.string().trim().min(1).max(5000) });

export async function registerCommentRoutes(app: FastifyInstance, service: CommentsService, sessions: SessionsService) {
  const typed = app.withTypeProvider<ZodTypeProvider>();
  const auth = requireAuth(sessions);
  typed.get('/cards/:cardId/comments', { preHandler: auth, schema: { params: cardParams } },
    async (request) => ({ comments: await service.list(request.params.cardId, request.currentUser!.id) }));
  typed.post('/cards/:cardId/comments', { preHandler: auth, schema: { params: cardParams, body } },
    async (request) => ({ comment: await service.create(request.params.cardId, request.currentUser!.id, request.body.content) }));
  typed.patch('/cards/:cardId/comments/:commentId', { preHandler: auth, schema: { params: commentParams, body } },
    async (request) => ({ comment: await service.update(request.params.cardId, request.params.commentId, request.currentUser!.id, request.body.content) }));
  typed.delete('/cards/:cardId/comments/:commentId', { preHandler: auth, schema: { params: commentParams } },
    async (request) => { await service.delete(request.params.cardId, request.params.commentId, request.currentUser!.id); return { ok: true }; });
}
