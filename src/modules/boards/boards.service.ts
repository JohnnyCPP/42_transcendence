import { badRequest, forbidden, notFound } from '../../shared/errors/httpErrors.js';
import { BOARD_ROLE, BOARD_ROLES, ORG_ROLE } from '../authorization/roles.js';
import type { OrganizationsService } from '../organizations/organizations.service.js';
import type { BoardsRepository } from './boards.repository.js';
import type { Board, BoardMember, BoardRole, CreateBoardInput, UpdateBoardInput } from './boards.types.js';
import { defaultPagination, type Page, type PaginationInput } from '../../shared/pagination.js';

export class BoardsService 
{
  constructor(
    private readonly boardsRepository: BoardsRepository,
    private readonly organizationsService: OrganizationsService
  ) {}

  async createBoard(input: CreateBoardInput): Promise<Board> 
  {
    const organization = await this.organizationsService.getOrganizationForUser(input.organizationId, input.actorUserId);
    if (organization.role !== ORG_ROLE.OWNER && organization.role !== ORG_ROLE.ADMIN)
      throw forbidden('Organization admin role required', 'ORGANIZATION_ADMIN_REQUIRED');
    return this.boardsRepository.create(input);
  }

  async listOrganizationBoards(organizationId: string, actorUserId: string, pagination: PaginationInput = defaultPagination): Promise<Page<Board>>
  {
    await this.organizationsService.getOrganizationForUser(organizationId, actorUserId);
    return this.boardsRepository.listForOrganization(organizationId, pagination);
  }

  async getBoardForUser(
    boardId: string,
    actorUserId: string,
    permission: 'read' | 'write' | 'admin' = 'read'
  ): Promise<Board>
  {
    const board = await this.boardsRepository.findById(boardId);
    if (!board) throw notFound('Board not found', 'BOARD_NOT_FOUND');
    const role = await this.resolveBoardRole(board, actorUserId);
    if (permission === 'admin' && role !== BOARD_ROLE.ADMIN)
      throw forbidden('Board admin role required', 'INSUFFICIENT_BOARD_ROLE');
    if (permission === 'write' && role === BOARD_ROLE.OBSERVER)
      throw forbidden('Board membership required to write', 'INSUFFICIENT_BOARD_ROLE');
    return board;
  }

  async updateBoard(input: UpdateBoardInput): Promise<Board> 
  {
    const board = await this.getBoardForUser(input.boardId, input.actorUserId, 'admin');
    return this.boardsRepository.update({ ...input, boardId: board.id });
  }

  async getBoardAccess(boardId: string, actorUserId: string) {
    const board = await this.getBoardForUser(boardId, actorUserId);
    const organization = await this.organizationsService.getOrganizationForUser(board.organizationId, actorUserId);
    const membership = await this.boardsRepository.findMember(boardId, actorUserId);
    const boardRole = await this.resolveBoardRole(board, actorUserId);
    return { organizationRole: organization.role, boardRole, canWrite: boardRole !== BOARD_ROLE.OBSERVER,
      canArchive: organization.role === ORG_ROLE.OWNER || membership?.role === BOARD_ROLE.ADMIN };
  }

  async setBoardMemberRole(input: {
    boardId: string;
    actorUserId: string;
    userId: string;
    role: BoardRole;
  }): Promise<BoardMember>
  {
    if (!BOARD_ROLES.includes(input.role)) throw badRequest('Invalid board role', 'INVALID_ROLE');
    const board = await this.getBoardForUser(input.boardId, input.actorUserId, 'admin');
    await this.organizationsService.getOrganizationForUser(board.organizationId, input.userId);
    return this.boardsRepository.upsertMember(input);
  }

  async removeBoardMember(boardId: string, actorUserId: string, userId: string): Promise<void> {
    await this.getBoardForUser(boardId, actorUserId, 'admin');
    if (!(await this.boardsRepository.findMember(boardId, userId)))
      throw notFound('Board member not found', 'BOARD_MEMBER_NOT_FOUND');
    await this.boardsRepository.removeMember(boardId, userId);
  }

  async archiveBoard(boardId: string, actorUserId: string): Promise<void> {
    const board = await this.getBoardForUser(boardId, actorUserId, 'read');
    const organization = await this.organizationsService.getOrganizationForUser(board.organizationId, actorUserId);
    const membership = await this.boardsRepository.findMember(boardId, actorUserId);
    if (organization.role !== ORG_ROLE.OWNER && membership?.role !== BOARD_ROLE.ADMIN)
      throw forbidden('Board admin or organization owner required', 'INSUFFICIENT_BOARD_ROLE');
    await this.boardsRepository.archive(boardId);
  }

  private async resolveBoardRole(board: Board, userId: string): Promise<BoardRole>
  {
    const organization = await this.organizationsService.getOrganizationForUser(board.organizationId, userId);
    if (organization.role === ORG_ROLE.OWNER || organization.role === ORG_ROLE.ADMIN) return BOARD_ROLE.ADMIN;
    return (await this.boardsRepository.findMember(board.id, userId))?.role ?? BOARD_ROLE.OBSERVER;
  }
}
