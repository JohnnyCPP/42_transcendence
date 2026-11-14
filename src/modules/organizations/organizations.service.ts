import { badRequest, forbidden, notFound } from '../../shared/errors/httpErrors.js';
import { ORG_ROLE } from '../authorization/roles.js';
import {
  canManageOrganization,
  type OrganizationsRepository
} from './organizations.repository.js';
import type { CreateOrganizationInput, Organization, OrganizationWithRole, UpdateOrganizationInput } from './organizations.types.js';
import type { OrganizationMember, OrganizationRole } from './organizations.types.js';
import { defaultPagination, type Page, type PaginationInput } from '../../shared/pagination.js';
import type { UsersService } from '../users/users.service.js';

export class OrganizationsService 
{
  constructor(
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly usersService: UsersService
  ) {}

  createOrganization(input: CreateOrganizationInput): Promise<OrganizationWithRole> 
  {
    return this.organizationsRepository.createWithOwner(input);
  }

  listUserOrganizations(userId: string, pagination: PaginationInput = defaultPagination): Promise<Page<OrganizationWithRole>>
  {
    return this.organizationsRepository.listForUser(userId, pagination);
  }

  async getOrganizationForUser(organizationId: string, userId: string): Promise<OrganizationWithRole>
   {
    const organization = await this.organizationsRepository.findForUser(organizationId, userId);
    if (!organization) 
      throw notFound('Organization not found', 'ORGANIZATION_NOT_FOUND');
    return organization;
  }

  async updateOrganization(input: UpdateOrganizationInput): Promise<Organization> 
  {
    const member = await this.getOrganizationForUser(input.organizationId, input.actorUserId);
    if (!canManageOrganization(member.role)) 
    {
      throw forbidden('Organization admin role required', 'ORGANIZATION_ADMIN_REQUIRED');
    }
    return this.organizationsRepository.update(input);
  }

  async setOrganizationMemberRole(input: {
    organizationId: string;
    actorUserId: string;
    userId: string;
    role: Exclude<OrganizationRole, 'owner'>;
  }): Promise<OrganizationMember>
  {
    if (!([ORG_ROLE.MEMBER, ORG_ROLE.ADMIN] as string[]).includes(input.role))
      throw badRequest('Invalid organization role', 'INVALID_ROLE');
    const actor = await this.getOrganizationForUser(input.organizationId, input.actorUserId);
    if (!canManageOrganization(actor.role))
      throw forbidden('Organization admin role required', 'ORGANIZATION_ADMIN_REQUIRED');
    const current = await this.organizationsRepository.findMember(input.organizationId, input.userId);
    if (current?.role === ORG_ROLE.OWNER)
      throw forbidden('The organization owner role cannot be changed', 'ORGANIZATION_OWNER_IMMUTABLE');
    if (actor.role !== ORG_ROLE.OWNER && (input.role === ORG_ROLE.ADMIN || (current && current.role !== input.role)))
      throw forbidden('Only an organization owner can manage admins', 'ORGANIZATION_OWNER_REQUIRED');
    const target = await this.usersService.findById(input.userId);
    if (!target || target.status !== 'active')
      throw notFound('User not found', 'USER_NOT_FOUND');
    return this.organizationsRepository.upsertMember(input);
  }

  async archiveOrganization(organizationId: string, actorUserId: string): Promise<void> {
    const organization = await this.getOrganizationForUser(organizationId, actorUserId);
    if (organization.role !== ORG_ROLE.OWNER)
      throw forbidden('Organization owner role required', 'INSUFFICIENT_ORG_ROLE');
    await this.organizationsRepository.archive(organizationId);
  }

  async listMembers(organizationId: string, actorUserId: string) {
    await this.getOrganizationForUser(organizationId, actorUserId);
    const members = await this.organizationsRepository.listMembers(organizationId);
    return Promise.all(members.map(async (member) => {
      const user = await this.usersService.findById(member.userId);
      return { ...member, user: user ? { id: user.id, username: user.username, displayName: user.displayName } : null };
    }));
  }

  async removeOrganizationMember(organizationId: string, actorUserId: string, userId: string): Promise<void> {
    const actor = await this.getOrganizationForUser(organizationId, actorUserId);
    if (!canManageOrganization(actor.role)) throw forbidden('Organization admin role required', 'INSUFFICIENT_ORG_ROLE');
    const target = await this.organizationsRepository.findMember(organizationId, userId);
    if (!target) throw notFound('Organization member not found', 'ORGANIZATION_MEMBER_NOT_FOUND');
    if (target.role === ORG_ROLE.OWNER || (target.role === ORG_ROLE.ADMIN && actor.role !== ORG_ROLE.OWNER))
      throw forbidden('Only the owner can remove an admin; owners cannot be removed', 'INSUFFICIENT_ORG_ROLE');
    await this.organizationsRepository.removeMember(organizationId, userId);
  }
}
