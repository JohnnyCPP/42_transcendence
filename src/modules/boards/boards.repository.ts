import { createRandomToken } from "../../shared/crypto/createRandomToken.js";
import { paginateArray } from "../../shared/pagination.js";
import type { Page, PaginationInput } from "../../shared/pagination.js";
import type { Board, BoardMember, CreateBoardInput, SetBoardMemberInput, UpdateBoardInput } from "./boards.types.js";

export	interface	BoardsRepository
{
	create(input: CreateBoardInput): Promise<Board>;

	listByOrganization(organizationId: string, pagination: PaginationInput): Promise<Page<Board>>;

	listByOrganizations(organizationIds: string[], pagination: PaginationInput): Promise<Page<Board>>;

	findById(boardId: string): Promise<Board | null>;

	findMember(boardId: string, userId: string): Promise<BoardMember | null>;

	upsertMember(input: SetBoardMemberInput): Promise<BoardMember>;
	removeMember(boardId: string, userId: string): Promise<void>;

	update(input: UpdateBoardInput): Promise<Board>;

	archive(boardId: string): Promise<Board>;
}

export	class	InMemoryBoardsRepository	implements	BoardsRepository
{
	private	readonly	boards = new Map<string, Board>();
	private	readonly	members = new Map<string, BoardMember>();

	async removeMember(boardId: string, userId: string): Promise<void>
	{
		this.members.delete(memberKey(boardId, userId));
	}

	async removeUserFromOrganization(organizationId: string, userId: string): Promise<void>
	{
		for (const board of this.boards.values())
			if (board.organizationId === organizationId) this.members.delete(memberKey(board.id, userId));
	}

	async	create(input: CreateBoardInput): Promise<Board>
	{
		const	now = new Date();
		const	board: Board = {

			id: createRandomToken(16),
			createdByUserId: input.actorUserId,
			organizationId: input.organizationId,

			name: input.name.trim(),
			description: input.description?.trim() || null,

			createdAt: now,
			updatedAt: now,
			archivedAt: null
		};

		this.boards.set(board.id, board);
		this.members.set(memberKey(board.id, input.actorUserId), {

			boardId: board.id,
			userId: input.actorUserId,

			role: "admin",

			joinedAt: now
		});
		return board;
	}

	async	listByOrganization(organizationId: string, pagination: PaginationInput): Promise<Page<Board>>
	{
		const	boards = [...this.boards.values()]
						.filter((board) => board.organizationId === organizationId && !board.archivedAt)
						.sort((left, right) =>
							right.createdAt.getTime() - left.createdAt.getTime() || right.id.localeCompare(left.id));

		return paginateArray(boards, pagination);
	}

	async	listByOrganizations(organizationIds: string[], pagination: PaginationInput): Promise<Page<Board>>
	{
		let	ids;
		let	boards;

		ids = new Set(organizationIds);
		boards = [...this.boards.values()]
			.filter((b) => ids.has(b.organizationId) && !b.archivedAt)
			.sort((l, r) => r.createdAt.getTime() - l.createdAt.getTime() || r.id.localeCompare(l.id));
		return paginateArray(boards, pagination);
	}

	async	findById(boardId: string): Promise<Board | null>
	{
		const	board = this.boards.get(boardId);

		if (!board || board.archivedAt)
			return null;
		return board;
	}

	async	findMember(boardId: string, userId: string): Promise<BoardMember | null>
	{
		return this.members.get(memberKey(boardId, userId)) ?? null;
	}

	async	upsertMember(input: SetBoardMemberInput): Promise<BoardMember>
	{
		const	key = memberKey(input.boardId, input.userId);
		const	current = this.members.get(key);
		const	member: BoardMember = { ...input, joinedAt: current?.joinedAt ?? new Date() };

		this.members.set(key, member);
		return member;
	}

	async	update(input: UpdateBoardInput): Promise<Board>
	{
		const	board = this.boards.get(input.boardId);

		if (!board || board.archivedAt)
			throw new Error("Board not found");
		board.name = input.name?.trim() ?? board.name;
		board.description = input.description === undefined ? board.description : input.description?.trim() || null;
		board.updatedAt = new Date();
		return board;
	}

	async	archive(boardId: string): Promise<Board>
	{
		let	board;

		board = this.boards.get(boardId);
		if (!board)
			throw new Error("Board not found");
		if (!board.archivedAt)
			board.archivedAt = new Date();
		return board;
	}
}

function	memberKey(boardId: string, userId: string): string
{
	return `${boardId}:${userId}`;
}
