import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../authorization/requireAuth.js';
import { requireRole } from '../authorization/requireRole.js';
import type { SessionsService } from '../sessions/sessions.service.js';
import type { UsersService } from './users.service.js';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { paginationQuerySchema } from '../../shared/http/pagination.js';
import { paginationMetadata } from '../../shared/pagination.js';
import { z } from 'zod';
import { GLOBAL_ROLE, GLOBAL_ROLES } from '../authorization/roles.js';

const listQuerySchema = paginationQuerySchema.extend({
  role: z.enum(GLOBAL_ROLES).optional(),
  status: z.enum(['active', 'disabled', 'deleted']).optional()
});
const userParamsSchema = z.object({ id: z.string().min(1) });
const updateUserSchema = z.object({
  displayName: z.string().trim().min(1).max(100).nullable().optional(),
  email: z.email().max(254).nullable().optional(),
  role: z.enum(GLOBAL_ROLES).optional(),
  status: z.enum(['active', 'disabled']).optional()
}).refine((value) => Object.keys(value).length > 0);

export async function registerUserRoutes(app: FastifyInstance, sessionsService: SessionsService, usersService: UsersService) 
{
  const typedApp = app.withTypeProvider<ZodTypeProvider>();
  app.get('/me', { preHandler: requireAuth(sessionsService) }, async (request) => ({
    user: request.currentUser
  }));

  typedApp.get(
    '/admin/users',
    {
      preHandler: [requireAuth(sessionsService), requireRole(GLOBAL_ROLE.ADMIN)],
      schema: { querystring: paginationQuerySchema }
    },
    async (request) => {
      const page = await usersService.listUsers(request.query);
      return { users: page.items, pagination: paginationMetadata(page) };
    }
  );

  typedApp.get('/users', {
    preHandler: [requireAuth(sessionsService), requireRole(GLOBAL_ROLE.MODERATOR, GLOBAL_ROLE.ADMIN)],
    schema: { querystring: listQuerySchema }
  }, async (request) => {
    const { limit, offset, role, status } = request.query;
    const page = await usersService.listUsers({ limit, offset }, { role, status });
    return { users: page.items, pagination: paginationMetadata(page) };
  });

  typedApp.get('/users/:id', {
    preHandler: [requireAuth(sessionsService), requireRole(GLOBAL_ROLE.MODERATOR, GLOBAL_ROLE.ADMIN)],
    schema: { params: userParamsSchema }
  }, async (request) => ({ user: await usersService.getManagedUser(request.params.id) }));

  typedApp.patch('/users/:id', {
    preHandler: [requireAuth(sessionsService), requireRole(GLOBAL_ROLE.ADMIN)],
    schema: { params: userParamsSchema, body: updateUserSchema }
  }, async (request) => ({ user: await usersService.updateManagedUser(request.currentUser!.id, request.params.id, request.body) }));

  typedApp.delete('/users/:id', {
    preHandler: [requireAuth(sessionsService), requireRole(GLOBAL_ROLE.ADMIN)],
    schema: { params: userParamsSchema }
  }, async (request) => ({ user: await usersService.deleteManagedUser(request.currentUser!.id, request.params.id) }));
}
