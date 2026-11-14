import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ORG_ROLE } from '../authorization/roles.js';
import { requireAuth } from '../authorization/requireAuth.js';
import { requireOrgRole } from '../authorization/requireScopeRole.js';
import type { SessionsService } from '../sessions/sessions.service.js';
import type { OrganizationsService } from './organizations.service.js';
import { paginationQuerySchema } from '../../shared/http/pagination.js';
import { paginationMetadata } from '../../shared/pagination.js';

const createOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().min(2).max(80).optional()
});

const updateOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  slug: z.string().trim().min(2).max(80).optional()
});

const organizationParamsSchema = z.object({
  organizationId: z.string().min(1)
});
const organizationMemberParamsSchema = z.object({
  organizationId: z.string().min(1),
  userId: z.string().min(1)
});
const organizationMemberSchema = z.object({ role: z.enum([ORG_ROLE.ADMIN, ORG_ROLE.MEMBER]) });

export async function registerOrganizationRoutes(
  app: FastifyInstance,
  organizationsService: OrganizationsService,
  sessionsService: SessionsService
) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.post('/organizations', {
    preHandler: requireAuth(sessionsService),
    schema: { body: createOrganizationSchema }
  }, async (request) => {
    const body = request.body;
    const organization = await organizationsService.createOrganization({
      ...body,
      createdByUserId: request.currentUser!.id
    });
    return { organization };
  });

  typedApp.get('/organizations', {
    preHandler: requireAuth(sessionsService),
    schema: { querystring: paginationQuerySchema }
  }, async (request) => {
    const page = await organizationsService.listUserOrganizations(request.currentUser!.id, request.query);
    return { organizations: page.items, pagination: paginationMetadata(page) };
  });

  typedApp.get('/organizations/:organizationId', {
    preHandler: [requireAuth(sessionsService), requireOrgRole(organizationsService, ORG_ROLE.MEMBER)],
    schema: { params: organizationParamsSchema }
  }, async (request) => {
    const params = request.params;
    const organization = await organizationsService.getOrganizationForUser(
      params.organizationId,
      request.currentUser!.id
    );
    return { organization };
  });

  typedApp.patch('/organizations/:organizationId', {
    preHandler: [requireAuth(sessionsService), requireOrgRole(organizationsService, ORG_ROLE.ADMIN)],
    schema: {
      params: organizationParamsSchema,
      body: updateOrganizationSchema
    }
  }, async (request) => {
    const params = request.params;
    const body = request.body;
    const organization = await organizationsService.updateOrganization({
      organizationId: params.organizationId,
      actorUserId: request.currentUser!.id,
      ...body
    });
    return { organization };
  });

  typedApp.put('/organizations/:organizationId/members/:userId', {
    preHandler: [requireAuth(sessionsService), requireOrgRole(organizationsService, ORG_ROLE.ADMIN)],
    schema: { params: organizationMemberParamsSchema, body: organizationMemberSchema }
  }, async (request) => ({
    member: await organizationsService.setOrganizationMemberRole({
      organizationId: request.params.organizationId,
      actorUserId: request.currentUser!.id,
      userId: request.params.userId,
      role: request.body.role
    })
  }));

  typedApp.delete('/organizations/:organizationId/members/:userId', {
    preHandler: [requireAuth(sessionsService), requireOrgRole(organizationsService, ORG_ROLE.ADMIN)],
    schema: { params: organizationMemberParamsSchema }
  }, async (request) => {
    await organizationsService.removeOrganizationMember(request.params.organizationId, request.currentUser!.id, request.params.userId);
    return { ok: true };
  });

  typedApp.delete('/organizations/:organizationId', {
    preHandler: [requireAuth(sessionsService), requireOrgRole(organizationsService, ORG_ROLE.OWNER)],
    schema: { params: organizationParamsSchema }
  }, async (request) => {
    await organizationsService.archiveOrganization(request.params.organizationId, request.currentUser!.id);
    return { ok: true };
  });
}
