import { PrismaClient } from '@prisma/client';
import { randomToken } from '../../shared/crypto/randomToken.js';
import { assertSameListSet, type ListsRepository } from './lists.repository.js';
import type { BoardList, CreateListInput, ReorderListsInput, UpdateListInput } from './lists.types.js';
import type { Page, PaginationInput } from '../../shared/pagination.js';

export class PrismaListsRepository implements ListsRepository 
{
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * "select pg_advisory_xact_lock(
   *         hashtext(
   *                  ${`list-position:${input.boardId}`}
   *                 )
   *                              )"
   * Get an exclusive, transaction-level lock using the integer hash 
   * of 'list-position:<boardId>' as the key. If another transaction 
   * holds this lock, wait for it. Once this instance has the lock, continues. 
   * It will be released automatically when the transaction ends.
   *
   *
   * "select 1 as locked from (...) acquired"
   *
   * This is just a wrapper to make the query return something.
   * pg_advisory_xact_lock returns void.
   *
   * PostgreSQL doesn't allow a bare function call in a SELECT without 
   * a FROM clause in some contexts, so the implementation wraps it in 
   * a subquery named "acquired" and selects a dummy column "1 as locked".
   *
   * The result is irrelevant, the side effect is what matters.
   *
   *
   * "pg_advisory_xact_lock(...)"
   *
   * This is a PostgreSQL function that acquires an advisory lock.
   * An advisory lock is a tool you use in your code to coordinate 
   * between concurrent transactions.
   *
   * "xact" means the lock is transaction-scoped. It is automatically 
   * released the moment your transaction commits or rolls back. 
   * You don't need to manually unlock it.
   *
   * The function blocks (waits indefinitely) if another transaction 
   * already holds the same lock.
   *
   *
   * "hashtext( ${list-position:${input.boardId}} )"
   *
   * The advisory lock function takes an integer as a key. 
   * The string 'list-position:<boardId>' needs to become an integer. 
   * hashtext() is a PostgreSQL function that converts a string 
   * into a 32-bit integer hash.
   *
   * The prefix "list-position" is included to avoid collisions with 
   * other advisory locks in the codebase. If you only hashed the boardId, 
   * and somewhere else you also hashed a boardId for a different purpose, 
   * they might accidentally collide. The prefix creates a namespace.
   *
   * The "${...}" is Prisma's tagged template syntax. 
   * Prisma does not concatenate this string into the SQL. 
   * Instead, it converts it into a parameterized query (like $1). 
   * This prevents SQL injection.
   *
   *
   * If the lock still fails to prevent a race due to a deadlock (P2034) 
   * or unique constraint (P2002), the retry wrapper "withPositionRetry" 
   * catches the error and retries the transaction up to three times.
   */
  async create(input: CreateListInput): Promise<BoardList> 
  {
    return withPositionRetry(async () => this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
        select 1 as locked
        from (select pg_advisory_xact_lock(hashtext(${`list-position:${input.boardId}`}))) acquired
      `;
      const last = await tx.boardList.findFirst({ where: { boardId: input.boardId, archivedAt: null }, orderBy: { position: 'desc' }, select: { position: true } });
      const row = await tx.boardList.create({ data: { id: randomToken(16), boardId: input.boardId, name: input.name.trim(), position: (last?.position ?? 0) + 1000 } });
      return mapList(row);
    }));
  }

  async listForBoard(boardId: string, pagination: PaginationInput): Promise<Page<BoardList>>
  {
    const where = { boardId, archivedAt: null };
    const [rows, total] = await Promise.all([
      this.prisma.boardList.findMany({ where, orderBy: { position: 'asc' }, take: pagination.limit, skip: pagination.offset }),
      this.prisma.boardList.count({ where })
    ]);
    return { items: rows.map(mapList), total, ...pagination };
  }

  async findById(listId: string): Promise<BoardList | null> 
  {
    const row = await this.prisma.boardList.findFirst({ where: { id: listId, archivedAt: null } });
    return row ? mapList(row) : null;
  }

  async update(input: UpdateListInput): Promise<BoardList> 
  {
    const row = await this.prisma.boardList.update({ where: { id: input.listId }, data: { name: input.name?.trim() } });
    return mapList(row);
  }

  async reorder(input: ReorderListsInput): Promise<BoardList[]> 
  {
    return withPositionRetry(async () => this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
        select 1 as locked
        from (select pg_advisory_xact_lock(hashtext(${`list-position:${input.boardId}`}))) acquired
      `;
      const current = await tx.boardList.findMany({ where: { boardId: input.boardId, archivedAt: null }, orderBy: { position: 'asc' } });
      assertSameListSet(current.map((list) => list.id), input.listIds);
      // First use negative positions to avoid collisions with the unique key.
      for (const [index, id] of input.listIds.entries()) await tx.boardList.update({ where: { id }, data: { position: -(index + 1) } });
      for (const [index, id] of input.listIds.entries()) await tx.boardList.update({ where: { id }, data: { position: (index + 1) * 1000 } });
      const reordered = await tx.boardList.findMany({ where: { boardId: input.boardId, archivedAt: null }, orderBy: { position: 'asc' } });
      return reordered.map(mapList);
    }));
  }
}

function mapList(row: { id: string; boardId: string; name: string; position: number; createdAt: Date; updatedAt: Date; archivedAt: Date | null }): BoardList 
{
  return { id: row.id, boardId: row.boardId, name: row.name, position: row.position, createdAt: row.createdAt, updatedAt: row.updatedAt, archivedAt: row.archivedAt };
}

async function withPositionRetry<T>(operation: () => Promise<T>): Promise<T>
{
  for (let attempt = 0; attempt < 3; attempt += 1)
  {
    try { return await operation(); }
    catch (error)
    {
      const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
      if ((code !== 'P2002' && code !== 'P2034') || attempt === 2) throw error;
    }
  }
  throw new Error('Unreachable position retry state');
}
