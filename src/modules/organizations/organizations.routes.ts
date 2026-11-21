import {
	createOrganizationDocs,
	getOrganizationDocs,
	listOrganizationsDocs,
	organizationMemberSchema as memberResponseSchema,
	organizationErrorSchema,
	setOrganizationMemberRoleDocs,
	updateOrganizationDocs
} from "./organizations.types.js";
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

  typedApp.post('/api/v1/organizations', {
    preHandler: requireAuth(sessionsService),
    schema: { 
			tags: createOrganizationDocs.tags,
			summary: createOrganizationDocs.summary,
			description: createOrganizationDocs.description,
			body: createOrganizationDocs.body,
			response: createOrganizationDocs.response,
			security: createOrganizationDocs.security
	}
  }, async (request) => {
    const body = request.body;
    const organization = await organizationsService.createOrganization({
      ...body,
      createdByUserId: request.currentUser!.id
    });
    return { organization };
  });

  typedApp.get('/api/v1/organizations', {
    preHandler: requireAuth(sessionsService),
    schema: {
			tags: listOrganizationsDocs.tags,
			summary: listOrganizationsDocs.summary,
			description: listOrganizationsDocs.description,
			querystring: listOrganizationsDocs.querystring,
			response: listOrganizationsDocs.response,
			security: listOrganizationsDocs.security
	}
  }, async (request) => {
    const page = await organizationsService.listUserOrganizations(request.currentUser!.id, request.query);
    return { organizations: page.items, pagination: paginationMetadata(page) };
  });

  typedApp.get('/api/v1/organizations/:organizationId', {
    preHandler: [requireAuth(sessionsService), requireOrgRole(organizationsService, ORG_ROLE.MEMBER)],
    schema: {
			tags: getOrganizationDocs.tags,
			summary: getOrganizationDocs.summary,
			description: getOrganizationDocs.description,
			params: getOrganizationDocs.params,
			response: getOrganizationDocs.response,
			security: getOrganizationDocs.security
	}
  }, async (request) => {
    const params = request.params;
    const organization = await organizationsService.getOrganizationForUser(
      params.organizationId,
      request.currentUser!.id
    );
    return { organization };
  });

  typedApp.patch('/api/v1/organizations/:organizationId', {
    preHandler: [requireAuth(sessionsService), requireOrgRole(organizationsService, ORG_ROLE.ADMIN)],
    schema: {
			tags: updateOrganizationDocs.tags,
			summary: updateOrganizationDocs.summary,
			description: updateOrganizationDocs.description,
			params: updateOrganizationDocs.params,
			body: updateOrganizationDocs.body,
			response: updateOrganizationDocs.response,
			security: updateOrganizationDocs.security
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

  typedApp.post('/api/v1/organizations/:organizationId/members', {
    preHandler: [requireAuth(sessionsService), requireOrgRole(organizationsService, ORG_ROLE.ADMIN)],
    schema: {
      tags: ['Organizations'],
      summary: 'Add an existing user to an organization',
      params: organizationParamsSchema,
      body: z.object({ userId: z.string().trim().min(1), role: z.enum([ORG_ROLE.MEMBER, ORG_ROLE.ADMIN]).default(ORG_ROLE.MEMBER) }),
      response: {
        200: z.object({ member: memberResponseSchema }),
        400: organizationErrorSchema,
        401: organizationErrorSchema,
        403: organizationErrorSchema,
        404: organizationErrorSchema,
        409: organizationErrorSchema
      },
      security: []
    }
  }, async (request) => ({
    member: await organizationsService.addOrganizationMember({
      organizationId: request.params.organizationId,
      actorUserId: request.currentUser!.id,
      ...request.body
    })
  }));

  typedApp.put('/api/v1/organizations/:organizationId/members/:userId', {
    preHandler: [requireAuth(sessionsService), requireOrgRole(organizationsService, ORG_ROLE.ADMIN)],
    schema: {
			tags: setOrganizationMemberRoleDocs.tags,
			summary: setOrganizationMemberRoleDocs.summary,
			description: setOrganizationMemberRoleDocs.description,
			params: setOrganizationMemberRoleDocs.params,
			body: setOrganizationMemberRoleDocs.body,
			response: setOrganizationMemberRoleDocs.response,
			security: setOrganizationMemberRoleDocs.security
	}
  }, async (request) => ({
    member: await organizationsService.setOrganizationMemberRole({
      organizationId: request.params.organizationId,
      actorUserId: request.currentUser!.id,
      userId: request.params.userId,
      role: request.body.role
    })
  }));

  typedApp.get('/api/v1/organizations/:organizationId/members', {
    preHandler: [requireAuth(sessionsService), requireOrgRole(organizationsService, ORG_ROLE.MEMBER)],
    schema: { params: organizationParamsSchema }
  }, async (request) => ({ members: await organizationsService.listMembers(request.params.organizationId, request.currentUser!.id) }));

  typedApp.delete('/api/v1/organizations/:organizationId/members/:userId', {
    preHandler: [requireAuth(sessionsService), requireOrgRole(organizationsService, ORG_ROLE.ADMIN)],
    schema: { params: organizationMemberParamsSchema }
  }, async (request) => {
    await organizationsService.removeOrganizationMember(request.params.organizationId, request.currentUser!.id, request.params.userId);
    return { ok: true };
  });

  typedApp.delete('/api/v1/organizations/:organizationId', {
    preHandler: [requireAuth(sessionsService), requireOrgRole(organizationsService, ORG_ROLE.OWNER)],
    schema: { params: organizationParamsSchema }
  }, async (request) => {
    await organizationsService.archiveOrganization(request.params.organizationId, request.currentUser!.id);
    return { ok: true };
  });
}
