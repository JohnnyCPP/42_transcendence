import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../authorization/requireAuth.js';
import type { SessionsService } from '../sessions/sessions.service.js';
import type { ListsService } from './lists.service.js';

const createListSchema = z.object({
  name: z.string().trim().min(1).max(80)
});

const updateListSchema = z.object({
  name: z.string().trim().min(1).max(80).optional()
});

const reorderListsSchema = z.object({
  listIds: z.array(z.string().min(1)).min(1)
});

export async function registerListRoutes(
  app: FastifyInstance,
  listsService: ListsService,
  sessionsService: SessionsService
) 
{
  
  app.post('/boards/:boardId/lists', { preHandler: requireAuth(sessionsService) }, async (request) => {
    const params = z.object({ boardId: z.string().min(1) }).parse(request.params);
    const body = createListSchema.parse(request.body);
    const list = await listsService.createList({
      boardId: params.boardId,
      actorUserId: request.currentUser!.id,
      ...body
    });
    return { list };
  });

  app.get('/boards/:boardId/lists', { preHandler: requireAuth(sessionsService) }, async (request) => {
    const params = z.object({ boardId: z.string().min(1) }).parse(request.params);
    const lists = await listsService.listBoardLists(params.boardId, request.currentUser!.id);
    return { lists };
  });

  app.patch('/lists/:listId', { preHandler: requireAuth(sessionsService) }, async (request) => {
    const params = z.object({ listId: z.string().min(1) }).parse(request.params);
    const body = updateListSchema.parse(request.body);
    const list = await listsService.updateList({
      listId: params.listId,
      actorUserId: request.currentUser!.id,
      ...body
    });
    return { list };
  });

  app.post('/boards/:boardId/lists/reorder', { preHandler: requireAuth(sessionsService) }, async (request) => {
    const params = z.object({ boardId: z.string().min(1) }).parse(request.params);
    const body = reorderListsSchema.parse(request.body);
    const lists = await listsService.reorderLists({
      boardId: params.boardId,
      actorUserId: request.currentUser!.id,
      listIds: body.listIds
    });
    return { lists };
  });
}
