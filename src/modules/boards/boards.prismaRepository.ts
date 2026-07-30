import { PrismaClient } from '@prisma/client';
import { randomToken } from '../../shared/crypto/randomToken.js';
import type { BoardsRepository } from './boards.repository.js';
import type { Board, CreateBoardInput, UpdateBoardInput } from './boards.types.js';

export class PrismaBoardsRepository implements BoardsRepository 
{
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateBoardInput): Promise<Board> 
  {
    const row = await this.prisma.board.create({ data: { id: randomToken(16), organizationId: input.organizationId, name: input.name.trim(), description: input.description?.trim() || null, createdByUserId: input.actorUserId } });
    return mapBoard(row);
  }

  async listForOrganization(organizationId: string): Promise<Board[]> 
  {
    const rows = await this.prisma.board.findMany({ where: { organizationId, archivedAt: null }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapBoard);
  }

  async findById(boardId: string): Promise<Board | null> 
  {
    const row = await this.prisma.board.findFirst({ where: { id: boardId, archivedAt: null } });
    return row ? mapBoard(row) : null;
  }

  async update(input: UpdateBoardInput): Promise<Board> 
  {
    const row = await this.prisma.board.update({ where: { id: input.boardId }, data: { name: input.name?.trim(), description: input.description === undefined ? undefined : input.description?.trim() || null } });
    return mapBoard(row);
  }
}

function mapBoard(row: { id: string; organizationId: string; name: string; description: string | null; createdByUserId: string; createdAt: Date; updatedAt: Date; archivedAt: Date | null }): Board 
{
  return { id: row.id, organizationId: row.organizationId, name: row.name, description: row.description, createdByUserId: row.createdByUserId, createdAt: row.createdAt, updatedAt: row.updatedAt, archivedAt: row.archivedAt };
}
