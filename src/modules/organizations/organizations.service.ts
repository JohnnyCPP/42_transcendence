import { forbidden, notFound } from '../../shared/errors/httpErrors.js';
import {
  canManageOrganization,
  type OrganizationsRepository
} from './organizations.repository.js';
import type { CreateOrganizationInput, Organization, OrganizationWithRole, UpdateOrganizationInput } from './organizations.types.js';

export class OrganizationsService 
{
  constructor(private readonly organizationsRepository: OrganizationsRepository) {}

  createOrganization(input: CreateOrganizationInput): Promise<OrganizationWithRole> 
  {
    return this.organizationsRepository.createWithOwner(input);
  }

  listUserOrganizations(userId: string): Promise<OrganizationWithRole[]> 
  {
    return this.organizationsRepository.listForUser(userId);
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
    const member = await this.organizationsRepository.findMember(input.organizationId, input.actorUserId);
    if (!member) 
      throw notFound('Organization not found', 'ORGANIZATION_NOT_FOUND');
    if (!canManageOrganization(member.role)) 
    {
      throw forbidden('Organization admin role required', 'ORGANIZATION_ADMIN_REQUIRED');
    }
    return this.organizationsRepository.update(input);
  }
}
