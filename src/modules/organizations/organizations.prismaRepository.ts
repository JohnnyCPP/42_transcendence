import { PrismaClient } from '@prisma/client';
import { randomToken } from '../../shared/crypto/randomToken.js';
import { conflict } from '../../shared/errors/httpErrors.js';
import type { OrganizationsRepository } from './organizations.repository.js';
import { normalizeSlug } from './organizations.repository.js';
import type { CreateOrganizationInput, Organization, OrganizationMember, OrganizationWithRole, UpdateOrganizationInput } from './organizations.types.js';

export class PrismaOrganizationsRepository implements OrganizationsRepository 
{
  constructor(private readonly prisma: PrismaClient) {}

  async createWithOwner(input: CreateOrganizationInput): Promise<OrganizationWithRole> 
  {
    const id = randomToken(16);
    const slug = normalizeSlug(input.slug ?? input.name);
    try {
      const organization = await this.prisma.$transaction(async (tx) => {
        const created = await tx.organization.create({
          data: { id, name: input.name.trim(), slug, createdByUserId: input.createdByUserId }
        });
        await tx.organizationMember.create({ data: { organizationId: id, userId: input.createdByUserId, role: 'owner' } });
        return created;
      });
      return { ...mapOrganization(organization), role: 'owner' };
    } catch (error) {
      if (isUniqueViolation(error)) throw conflict('Organization slug already exists', 'ORGANIZATION_SLUG_EXISTS');
      throw error;
    }
  }

  async listForUser(userId: string): Promise<OrganizationWithRole[]> 
  {
    const rows = await this.prisma.organization.findMany({
      where: { archivedAt: null, members: { some: { userId } } },
      include: { members: { where: { userId }, select: { role: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return rows.map((row) => ({ ...mapOrganization(row), role: row.members[0].role as OrganizationWithRole['role'] }));
  }

  async findForUser(organizationId: string, userId: string): Promise<OrganizationWithRole | null> 
  {
    const row = await this.prisma.organization.findFirst({
      where: { id: organizationId, archivedAt: null, members: { some: { userId } } },
      include: { members: { where: { userId }, select: { role: true } } }
    });
    return row ? { ...mapOrganization(row), role: row.members[0].role as OrganizationWithRole['role'] } : null;
  }

  async findMember(organizationId: string, userId: string): Promise<OrganizationMember | null> 
  {
    const row = await this.prisma.organizationMember.findUnique({ where: { organizationId_userId: { organizationId, userId } } });
    return row ? { organizationId: row.organizationId, userId: row.userId, role: row.role as OrganizationMember['role'], joinedAt: row.joinedAt } : null;
  }

  async update(input: UpdateOrganizationInput): Promise<Organization> 
  {
    try {
      const row = await this.prisma.organization.update({
        where: { id: input.organizationId },
        data: { name: input.name?.trim(), slug: input.slug === undefined ? undefined : normalizeSlug(input.slug) }
      });
      return mapOrganization(row);
    } catch (error) {
      if (isUniqueViolation(error)) throw conflict('Organization slug already exists', 'ORGANIZATION_SLUG_EXISTS');
      throw error;
    }
  }
}

function mapOrganization(row: { id: string; name: string; slug: string; createdByUserId: string; createdAt: Date; updatedAt: Date; archivedAt: Date | null }): Organization 
{
  return { id: row.id, name: row.name, slug: row.slug, createdByUserId: row.createdByUserId, createdAt: row.createdAt, updatedAt: row.updatedAt, archivedAt: row.archivedAt };
}

function isUniqueViolation(error: unknown): boolean 
{
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}
