import { randomToken } from '../../shared/crypto/randomToken.js';
import { conflict } from '../../shared/errors/httpErrors.js';
import type {
  CreateOrganizationInput,
  Organization,
  OrganizationMember,
  OrganizationRole,
  OrganizationWithRole,
  UpdateOrganizationInput
} from './organizations.types.js';

export interface OrganizationsRepository 
{
  createWithOwner(input: CreateOrganizationInput): Promise<OrganizationWithRole>;
  listForUser(userId: string): Promise<OrganizationWithRole[]>;
  findForUser(organizationId: string, userId: string): Promise<OrganizationWithRole | null>;
  findMember(organizationId: string, userId: string): Promise<OrganizationMember | null>;
  update(input: UpdateOrganizationInput): Promise<Organization>;
}

export class InMemoryOrganizationsRepository implements OrganizationsRepository 
{
  private readonly organizations = new Map<string, Organization>();
  private readonly members = new Map<string, OrganizationMember>();

  async createWithOwner(input: CreateOrganizationInput): Promise<OrganizationWithRole> 
  {
    const slug = normalizeSlug(input.slug ?? input.name);
    for (const organization of this.organizations.values())
    {
      if (organization.slug === slug) 
        throw conflict('Organization slug already exists', 'ORGANIZATION_SLUG_EXISTS');
    }

    const now = new Date();
    const organization: Organization = {
      id: randomToken(16),
      name: input.name.trim(),
      slug,
      createdByUserId: input.createdByUserId,
      createdAt: now,
      updatedAt: now,
      archivedAt: null
    };
    this.organizations.set(organization.id, organization);
    this.members.set(memberKey(organization.id, input.createdByUserId), {
      organizationId: organization.id,
      userId: input.createdByUserId,
      role: 'owner',
      joinedAt: now
    });

    return { ...organization, role: 'owner' };
  }

  async listForUser(userId: string): Promise<OrganizationWithRole[]> 
  {
    return [...this.members.values()]
      .filter((member) => member.userId === userId)
      .map((member) => {
        const organization = this.organizations.get(member.organizationId)!;
        return { ...organization, role: member.role };
      })
      .filter((organization) => !organization.archivedAt)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
  }

  async findForUser(organizationId: string, userId: string): Promise<OrganizationWithRole | null> 
  {
    const organization = this.organizations.get(organizationId);
    const member = this.members.get(memberKey(organizationId, userId));
    if (!organization || !member || organization.archivedAt) 
      return null;
    return { ...organization, role: member.role };
  }

  async findMember(organizationId: string, userId: string): Promise<OrganizationMember | null> 
  {
    return this.members.get(memberKey(organizationId, userId)) ?? null;
  }

  async update(input: UpdateOrganizationInput): Promise<Organization> 
  {
    const organization = this.organizations.get(input.organizationId);
    if (!organization) 
      throw new Error('Organization not found');

    const nextSlug = input.slug ? normalizeSlug(input.slug) : organization.slug;
    for (const candidate of this.organizations.values()) 
    {
      if (candidate.id !== organization.id && candidate.slug === nextSlug) 
      {
        throw conflict('Organization slug already exists', 'ORGANIZATION_SLUG_EXISTS');
      }
    }

    organization.name = input.name?.trim() ?? organization.name;
    organization.slug = nextSlug;
    organization.updatedAt = new Date();
    return organization;
  }
}

export function normalizeSlug(value: string): string 
{
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function canManageOrganization(role: OrganizationRole): boolean 
{
  return role === 'owner' || role === 'admin';
}

function memberKey(organizationId: string, userId: string): string 
{
  return `${organizationId}:${userId}`;
}
