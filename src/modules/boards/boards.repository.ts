import { randomToken } from '../../shared/crypto/randomToken.js';
import type { Board, CreateBoardInput, UpdateBoardInput } from './boards.types.js';

export interface BoardsRepository 
{
  create(input: CreateBoardInput): Promise<Board>;
  listForOrganization(organizationId: string): Promise<Board[]>;
  findById(boardId: string): Promise<Board | null>;
  update(input: UpdateBoardInput): Promise<Board>;
}

export class InMemoryBoardsRepository implements BoardsRepository 
{
  private readonly boards = new Map<string, Board>();

  async create(input: CreateBoardInput): Promise<Board> 
  {
    const now = new Date();
    const board: Board = {
      id: randomToken(16),
      organizationId: input.organizationId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      createdByUserId: input.actorUserId,
      createdAt: now,
      updatedAt: now,
      archivedAt: null
    };
    this.boards.set(board.id, board);
    return board;
  }

  async listForOrganization(organizationId: string): Promise<Board[]> 
  {
    return [...this.boards.values()]
      .filter((board) => board.organizationId === organizationId && !board.archivedAt)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
  }

  async findById(boardId: string): Promise<Board | null> 
  {
    const board = this.boards.get(boardId);
    if (!board || board.archivedAt) 
      return null;
    return board;
  }

  async update(input: UpdateBoardInput): Promise<Board> 
  {
    const board = this.boards.get(input.boardId);
    if (!board || board.archivedAt) 
      throw new Error('Board not found');
    board.name = input.name?.trim() ?? board.name;
    board.description = input.description === undefined ? board.description : input.description?.trim() || null;
    board.updatedAt = new Date();
    return board;
  }
}
