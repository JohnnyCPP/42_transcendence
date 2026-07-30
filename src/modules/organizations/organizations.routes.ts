import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../authorization/requireAuth.js';
import type { SessionsService } from '../sessions/sessions.service.js';
import type { OrganizationsService } from './organizations.service.js';

const createOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().min(2).max(80).optional()
});

const updateOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  slug: z.string().trim().min(2).max(80).optional()
});

export async function registerOrganizationRoutes(
  app: FastifyInstance,
  organizationsService: OrganizationsService,
  sessionsService: SessionsService
) {
  app.post('/organizations', { preHandler: requireAuth(sessionsService) }, async (request) => {
    const body = createOrganizationSchema.parse(request.body);
    const organization = await organizationsService.createOrganization({
      ...body,
      createdByUserId: request.currentUser!.id
    });
    return { organization };
  });

  app.get('/organizations', { preHandler: requireAuth(sessionsService) }, async (request) => ({
    organizations: await organizationsService.listUserOrganizations(request.currentUser!.id)
  }));

  app.get('/organizations/:organizationId', { preHandler: requireAuth(sessionsService) }, async (request) => {
    const params = z.object({ organizationId: z.string().min(1) }).parse(request.params);
    const organization = await organizationsService.getOrganizationForUser(
      params.organizationId,
      request.currentUser!.id
    );
    return { organization };
  });

  app.patch('/organizations/:organizationId', { preHandler: requireAuth(sessionsService) }, async (request) => {
    const params = z.object({ organizationId: z.string().min(1) }).parse(request.params);
    const body = updateOrganizationSchema.parse(request.body);
    const organization = await organizationsService.updateOrganization({
      organizationId: params.organizationId,
      actorUserId: request.currentUser!.id,
      ...body
    });
    return { organization };
  });
}
