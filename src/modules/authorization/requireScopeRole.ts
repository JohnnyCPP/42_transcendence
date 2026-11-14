import type { FastifyRequest } from 'fastify';
import { forbidden, unauthorized } from '../../shared/errors/httpErrors.js';
import type { OrganizationsService } from '../organizations/organizations.service.js';
import type { BoardsService } from '../boards/boards.service.js';
import { ORG_ROLE, type OrganizationRole } from './roles.js';

const orgRank: Record<OrganizationRole, number> = {
  [ORG_ROLE.MEMBER]: 0, [ORG_ROLE.ADMIN]: 1, [ORG_ROLE.OWNER]: 2
};

export function requireOrgRole(service: OrganizationsService, minimum: OrganizationRole) {
  return async (request: FastifyRequest) => {
    if (!request.currentUser) throw unauthorized();
    const { organizationId } = request.params as { organizationId: string };
    const organization = await service.getOrganizationForUser(organizationId, request.currentUser.id);
    if (orgRank[organization.role] < orgRank[minimum])
      throw forbidden('Insufficient organization role', 'INSUFFICIENT_ORG_ROLE');
  };
}

export function requireBoardRole(service: BoardsService, permission: 'read' | 'write' | 'admin') {
  return async (request: FastifyRequest) => {
    if (!request.currentUser) throw unauthorized();
    const { boardId } = request.params as { boardId: string };
    await service.getBoardForUser(boardId, request.currentUser.id, permission);
  };
}
