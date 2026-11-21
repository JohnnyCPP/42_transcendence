import { badRequest, forbidden, notFound } from "../../shared/errors/httpErrors.js";
import { BOARD_ROLE, BOARD_ROLES, ORG_ROLE } from "../authorization/roles.js";
import { defaultPagination } from "../../shared/pagination.js";
import type { Board, BoardMember, CreateBoardInput, UpdateBoardInput } from "./boards.types.js";
import type { BoardRole } from "../authorization/roles.js";
import type { BoardsRepository } from "./boards.repository.js";
import type { OrganizationsService } from "../organizations/organizations.service.js";
import type { Page, PaginationInput } from "../../shared/pagination.js";

export	class	BoardsService
{
	constructor(private readonly boardsRepository: BoardsRepository,
				private readonly organizationsService: OrganizationsService) {}

	async	createBoard(input: CreateBoardInput): Promise<Board>
	{
		let	organization;

		organization = await this.organizationsService.getOrganizationForUser(input.organizationId, input.actorUserId);
		if (organization.role !== ORG_ROLE.OWNER && organization.role !== ORG_ROLE.ADMIN)
			throw forbidden("Organization admin role required", "ORGANIZATION_ADMIN_REQUIRED");
		return this.boardsRepository.create(input);
	}

	async	listByUser(userId: string, pagination: PaginationInput = defaultPagination): Promise<Page<Board>>
	{
		let	organizationIds;

		organizationIds = await this.organizationsService.listOrganizationIds(userId);
		if (organizationIds.length === 0)
			return { items: [], total: 0, ...pagination };
		return this.boardsRepository.listByOrganizations(organizationIds, pagination);
	}

	async	listOrganizationBoards(organizationId: string,
								   actorUserId: string,
								   pagination: PaginationInput = defaultPagination): Promise<Page<Board>>
	{
		await this.organizationsService.getOrganizationForUser(organizationId, actorUserId);
		return this.boardsRepository.listByOrganization(organizationId, pagination);
	}

	async	getByBoardIdAndUserId(boardId: string,
								  actorUserId: string,
								  permission: "read" | "write" | "admin" = "read"): Promise<Board>
	{
		let	board;
		let	role;

		board = await this.boardsRepository.findById(boardId);
		if (!board)
			throw notFound("Board not found", "BOARD_NOT_FOUND");
		role = await this.resolveBoardRole(board, actorUserId);
		if (permission === "admin" && role !== BOARD_ROLE.ADMIN)
			throw forbidden("Board admin role required", "BOARD_ADMIN_REQUIRED");
		if (permission === "write" && role === BOARD_ROLE.OBSERVER)
			throw forbidden("Observers have read-only access", "BOARD_READ_ONLY");
		return board;
	}

	async	updateBoard(input: UpdateBoardInput): Promise<Board>
	{
		let	board;

		board = await this.getByBoardIdAndUserId(input.boardId, input.actorUserId, "admin");
		return this.boardsRepository.update({ ...input, boardId: board.id });
	}

	async	setBoardMemberRole(input: {

		boardId: string;
		actorUserId: string;
		userId: string;
		role: BoardRole;
	}): Promise<BoardMember>
	{
		let	board;

		if (!BOARD_ROLES.includes(input.role))
			throw badRequest("Invalid board role", "INVALID_ROLE");
		board = await this.getByBoardIdAndUserId(input.boardId, input.actorUserId, "admin");
		await this.organizationsService.getOrganizationForUser(board.organizationId, input.userId);
		return this.boardsRepository.upsertMember(input);
	}

	async removeBoardMember(boardId: string, actorUserId: string, userId: string): Promise<void>
	{
		await this.getByBoardIdAndUserId(boardId, actorUserId, "admin");
		if (!(await this.boardsRepository.findMember(boardId, userId)))
			throw notFound("Board member not found", "BOARD_MEMBER_NOT_FOUND");
		await this.boardsRepository.removeMember(boardId, userId);
	}

	private	async	resolveBoardRole(board: Board, userId: string): Promise<BoardRole>
	{
		let	organization;
		let	user;

		organization = await this.organizationsService.getOrganizationForUser(board.organizationId, userId);
		if (organization.role === ORG_ROLE.OWNER || organization.role === ORG_ROLE.ADMIN)
			return BOARD_ROLE.ADMIN;
		user = await this.boardsRepository.findMember(board.id, userId);
		if (user != null)
			return user.role;
		return BOARD_ROLE.MEMBER;
	}

	async	archiveBoard(boardId: string, actorUserId: string): Promise<Board>
	{
		let	board;

		board = await this.getByBoardIdAndUserId(boardId, actorUserId, "admin");
		return this.boardsRepository.archive(board.id);
	}
}
