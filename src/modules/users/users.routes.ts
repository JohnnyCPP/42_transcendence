import {
	deleteUserDocs,
	getMeDocs,
	getUserDocs,
	listAdminUsersDocs,
	listUsersDocs,
	updateUserDocs
} from "./users.types.js";
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
  typedApp.get('/api/v1/me', { preHandler: requireAuth(sessionsService),
		schema: {
			tags: getMeDocs.tags,
			summary: getMeDocs.summary,
			description: getMeDocs.description,
			response: getMeDocs.response,
			security: getMeDocs.security
		}
  }, async (request) => ({
    user: request.currentUser!
  }));

  typedApp.get(
    '/api/v1/admin-users',
    {
      preHandler: [requireAuth(sessionsService), requireRole(GLOBAL_ROLE.ADMIN)],
		schema: {
			tags: listAdminUsersDocs.tags,
			summary: listAdminUsersDocs.summary,
			description: listAdminUsersDocs.description,
			querystring: listAdminUsersDocs.querystring,
			response: listAdminUsersDocs.response,
			security: listAdminUsersDocs.security
		}
    },
    async (request) => {
      const page = await usersService.listUsers(request.query);
      return { users: page.items, pagination: paginationMetadata(page) };
    }
  );

  typedApp.get('/api/v1/users', {
    preHandler: [requireAuth(sessionsService), requireRole(GLOBAL_ROLE.MODERATOR, GLOBAL_ROLE.ADMIN)],
		schema: {
			tags: listUsersDocs.tags,
			summary: listUsersDocs.summary,
			description: listUsersDocs.description,
			querystring: listUsersDocs.querystring,
			response: listUsersDocs.response,
			security: listUsersDocs.security
		}
  }, async (request) => {
    const { limit, offset, role, status } = request.query;
    const page = await usersService.listUsers({ limit, offset }, { role, status });
    return { users: page.items, pagination: paginationMetadata(page) };
  });

  typedApp.get('/api/v1/users/:id', {
    preHandler: [requireAuth(sessionsService), requireRole(GLOBAL_ROLE.MODERATOR, GLOBAL_ROLE.ADMIN)],
		schema: {
			tags: getUserDocs.tags,
			summary: getUserDocs.summary,
			description: getUserDocs.description,
			params: getUserDocs.params,
			response: getUserDocs.response,
			security: getUserDocs.security
		}
  }, async (request) => ({ user: await usersService.getManagedUser(request.params.id) }));

  typedApp.patch('/api/v1/users/:id', {
    preHandler: [requireAuth(sessionsService), requireRole(GLOBAL_ROLE.ADMIN)],
		schema: {
			tags: updateUserDocs.tags,
			summary: updateUserDocs.summary,
			description: updateUserDocs.description,
			params: updateUserDocs.params,
			body: updateUserDocs.body,
			response: updateUserDocs.response,
			security: updateUserDocs.security
		}
  }, async (request) => ({ user: await usersService.updateManagedUser(request.currentUser!.id, request.params.id, request.body) }));

  typedApp.delete('/api/v1/users/:id', {
    preHandler: [requireAuth(sessionsService), requireRole(GLOBAL_ROLE.ADMIN)],
		schema: {
			tags: deleteUserDocs.tags,
			summary: deleteUserDocs.summary,
			description: deleteUserDocs.description,
			params: deleteUserDocs.params,
			response: deleteUserDocs.response,
			security: deleteUserDocs.security
		}
  }, async (request) => ({ user: await usersService.deleteManagedUser(request.currentUser!.id, request.params.id) }));
}
