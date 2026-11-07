import { PrismaClient } from '@prisma/client';
import { randomToken } from '../../shared/crypto/randomToken.js';
import { conflict } from '../../shared/errors/httpErrors.js';
import type { CreateUserInput, User, UserFilters, UserChanges } from './users.types.js';
import type { UsersRepository } from './users.repository.js';
import type { Page, PaginationInput } from '../../shared/pagination.js';
import { GLOBAL_ROLE } from '../authorization/roles.js';

export class PrismaUsersRepository implements UsersRepository 
{
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateUserInput): Promise<User> 
  {
    try {
      const row = await this.prisma.user.create({
        data: {
          id: randomToken(16),
          username: input.username.trim().toLowerCase(),
          email: input.email?.trim().toLowerCase() ?? null,
          displayName: input.displayName ?? null
        }
      });
      return mapUser(row);
    } catch (error) {
      if (isUniqueViolation(error)) throw conflict('User already exists');
      throw error;
    }
  }

  async findById(id: string): Promise<User | null> 
  {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? mapUser(row) : null;
  }

  async findByUsername(username: string): Promise<User | null> 
  {
    const row = await this.prisma.user.findUnique({ where: { username: username.trim().toLowerCase() } });
    return row ? mapUser(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> 
  {
    const row = await this.prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    return row ? mapUser(row) : null;
  }

  async list(pagination: PaginationInput, filters: UserFilters): Promise<Page<User>>
  {
    const where = { role: filters.role, status: filters.status ?? { not: 'deleted' as const } };
    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: pagination.limit,
        skip: pagination.offset
      }),
      this.prisma.user.count({ where })
    ]);
    return { items: rows.map(mapUser), total, ...pagination };
  }

  async updateManaged(id: string, changes: UserChanges): Promise<User | null>
  {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // The advisory lock serializes concurrent admin demotions/deletions; Prisma has no model query for this lock.
        await tx.$queryRaw`SELECT 1 AS locked FROM (SELECT pg_advisory_xact_lock(741182)) acquired`;
        const current = await tx.user.findUnique({ where: { id } });
        if (!current || current.status === 'deleted') return null;
        if (current.role === GLOBAL_ROLE.ADMIN && current.status === 'active' &&
          (changes.role && changes.role !== GLOBAL_ROLE.ADMIN || changes.status && changes.status !== 'active')) {
          const count = await tx.user.count({ where: { role: GLOBAL_ROLE.ADMIN, status: 'active' } });
          if (count <= 1) throw conflict('Cannot remove the last active admin', 'LAST_ADMIN');
        }
        const updated = await tx.user.update({ where: { id }, data: {
          ...changes,
          email: changes.email === undefined ? undefined : changes.email?.trim().toLowerCase() ?? null
        } });
        return mapUser(updated);
      });
    } catch (error) {
      if (isUniqueViolation(error)) throw conflict('Email already exists');
      throw error;
    }
  }
}

function mapUser(row: Awaited<ReturnType<PrismaClient['user']['findUnique']>> & object): User 
{
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    displayName: row.displayName,
    role: row.role as User['role'],
    status: row.status as User['status'],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

function isUniqueViolation(error: unknown): boolean 
{
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}
