import { PrismaClient } from '@prisma/client';
import { randomToken } from '../../shared/crypto/randomToken.js';
import { assertSameListSet, type ListsRepository } from './lists.repository.js';
import type { BoardList, CreateListInput, ReorderListsInput, UpdateListInput } from './lists.types.js';

export class PrismaListsRepository implements ListsRepository 
{
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateListInput): Promise<BoardList> 
  {
    const last = await this.prisma.boardList.findFirst({ where: { boardId: input.boardId, archivedAt: null }, orderBy: { position: 'desc' }, select: { position: true } });
    const row = await this.prisma.boardList.create({ data: { id: randomToken(16), boardId: input.boardId, name: input.name.trim(), position: (last?.position ?? 0) + 1000 } });
    return mapList(row);
  }

  async listForBoard(boardId: string): Promise<BoardList[]> 
  {
    const rows = await this.prisma.boardList.findMany({ where: { boardId, archivedAt: null }, orderBy: { position: 'asc' } });
    return rows.map(mapList);
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
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.boardList.findMany({ where: { boardId: input.boardId, archivedAt: null }, orderBy: { position: 'asc' } });
      assertSameListSet(current.map((list) => list.id), input.listIds);
      // First use negative positions to avoid collisions with the unique key.
      for (const [index, id] of input.listIds.entries()) await tx.boardList.update({ where: { id }, data: { position: -(index + 1) } });
      for (const [index, id] of input.listIds.entries()) await tx.boardList.update({ where: { id }, data: { position: (index + 1) * 1000 } });
      const reordered = await tx.boardList.findMany({ where: { boardId: input.boardId, archivedAt: null }, orderBy: { position: 'asc' } });
      return reordered.map(mapList);
    });
  }
}

function mapList(row: { id: string; boardId: string; name: string; position: number; createdAt: Date; updatedAt: Date; archivedAt: Date | null }): BoardList 
{
  return { id: row.id, boardId: row.boardId, name: row.name, position: row.position, createdAt: row.createdAt, updatedAt: row.updatedAt, archivedAt: row.archivedAt };
}
