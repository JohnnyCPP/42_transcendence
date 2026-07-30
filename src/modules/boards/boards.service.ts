import { notFound } from '../../shared/errors/httpErrors.js';
import type { OrganizationsService } from '../organizations/organizations.service.js';
import type { BoardsRepository } from './boards.repository.js';
import type { Board, CreateBoardInput, UpdateBoardInput } from './boards.types.js';

export class BoardsService 
{
  constructor(
    private readonly boardsRepository: BoardsRepository,
    private readonly organizationsService: OrganizationsService
  ) {}

  async createBoard(input: CreateBoardInput): Promise<Board> 
  {
    await this.organizationsService.getOrganizationForUser(input.organizationId, input.actorUserId);
    return this.boardsRepository.create(input);
  }

  async listOrganizationBoards(organizationId: string, actorUserId: string): Promise<Board[]> 
  {
    await this.organizationsService.getOrganizationForUser(organizationId, actorUserId);
    return this.boardsRepository.listForOrganization(organizationId);
  }

  async getBoardForUser(boardId: string, actorUserId: string): Promise<Board> 
  {
    const board = await this.boardsRepository.findById(boardId);
    if (!board) throw notFound('Board not found', 'BOARD_NOT_FOUND');
    await this.organizationsService.getOrganizationForUser(board.organizationId, actorUserId);
    return board;
  }

  async updateBoard(input: UpdateBoardInput): Promise<Board> 
  {
    const board = await this.getBoardForUser(input.boardId, input.actorUserId);
    return this.boardsRepository.update({ ...input, boardId: board.id });
  }
}
