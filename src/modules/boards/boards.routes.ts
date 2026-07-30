import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../authorization/requireAuth.js';
import type { SessionsService } from '../sessions/sessions.service.js';
import type { BoardsService } from './boards.service.js';

const createBoardSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional().nullable()
});

const updateBoardSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(500).optional().nullable()
});

export async function registerBoardRoutes(
  app: FastifyInstance,
  boardsService: BoardsService,
  sessionsService: SessionsService
) {
  app.post('/organizations/:organizationId/boards', { preHandler: requireAuth(sessionsService) }, async (request) => {
    const params = z.object({ organizationId: z.string().min(1) }).parse(request.params);
    const body = createBoardSchema.parse(request.body);
    const board = await boardsService.createBoard({
      organizationId: params.organizationId,
      actorUserId: request.currentUser!.id,
      ...body
    });
    return { board };
  });

  app.get('/organizations/:organizationId/boards', { preHandler: requireAuth(sessionsService) }, async (request) => {
    const params = z.object({ organizationId: z.string().min(1) }).parse(request.params);
    const boards = await boardsService.listOrganizationBoards(params.organizationId, request.currentUser!.id);
    return { boards };
  });

  app.get('/boards/:boardId', { preHandler: requireAuth(sessionsService) }, async (request) => {
    const params = z.object({ boardId: z.string().min(1) }).parse(request.params);
    const board = await boardsService.getBoardForUser(params.boardId, request.currentUser!.id);
    return { board };
  });

  app.patch('/boards/:boardId', { preHandler: requireAuth(sessionsService) }, async (request) => {
    const params = z.object({ boardId: z.string().min(1) }).parse(request.params);
    const body = updateBoardSchema.parse(request.body);
    const board = await boardsService.updateBoard({
      boardId: params.boardId,
      actorUserId: request.currentUser!.id,
      ...body
    });
    return { board };
  });
}
