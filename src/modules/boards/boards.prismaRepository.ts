import { createRandomToken } from "../../shared/crypto/createRandomToken.js";
import { PrismaClient } from "@prisma/client";
import type { BoardsRepository } from "./boards.repository.js";
import type { Board, BoardMember, CreateBoardInput, SetBoardMemberInput, UpdateBoardInput } from "./boards.types.js";
import type { Page, PaginationInput } from "../../shared/pagination.js";

export	class	PrismaBoardsRepository	implements	BoardsRepository
{
	constructor(private readonly prisma: PrismaClient) {}

	async removeMember(boardId: string, userId: string): Promise<void>
	{
		await this.prisma.boardMember.deleteMany({ where: { boardId, userId } });
	}

	async	create(input: CreateBoardInput): Promise<Board>
	{
		let	id;
		let	row;
		let	created;

		id = createRandomToken(16);
		row = await this.prisma.$transaction(async (tx) => {

			created = await tx.board.create({ 
				data: { 
					id, 
					organizationId: input.organizationId, 
					createdByUserId: input.actorUserId, 
					name: input.name.trim(), 
					description: input.description?.trim() || null 
				} 
			});
			await tx.boardMember.create({
				data: {
					boardId: id,
					userId: input.actorUserId,
					role: "admin"
				}
			});
			return created;
		});
		return mapBoard(row);
	}

	async	listByOrganization(organizationId: string, pagination: PaginationInput): Promise<Page<Board>>
	{
		const	where = {
			organizationId,
			archivedAt: null
		};
		const	orderBy = [
			{ createdAt: "desc" as const }, 
			{ id: "desc" as const }
		];
		const	[rows, total] = await Promise.all([

			this.prisma.board.findMany({
				where,
				orderBy,
				take: pagination.limit, 
				skip: pagination.offset 
			}),
			this.prisma.board.count({ where })
		]);
		return { 
			items: rows.map(mapBoard), 
			total, ...pagination 
		};
	}

	async	listByOrganizations(organizationIds: string[], pagination: PaginationInput): Promise<Page<Board>>
	{
		let	where;
		let	orderBy;
		let	rows;
		let	total;

		where = {
			organizationId: { in: organizationIds },
			archivedAt: null
		};
		orderBy = [
			{ createdAt: "desc" as const }, 
			{ id: "desc" as const }
		];
		[rows, total] = await Promise.all([
			this.prisma.board.findMany({
				where,
				orderBy,
				take: pagination.limit,
				skip: pagination.offset
			}),
			this.prisma.board.count({ where })
		]);
		return {
			items: rows.map(mapBoard),
			total,
			...pagination
		};
	}

	async	findById(boardId: string): Promise<Board | null>
	{
		let	row;

		row = await this.prisma.board.findFirst({
			where: {
				id: boardId,
				archivedAt: null
			}
		});
		return row ? mapBoard(row) : null;
	}

	async	findMember(boardId: string, userId: string): Promise<BoardMember | null>
	{
		let	row;

		row = await this.prisma.boardMember.findUnique({
			where: {
				boardId_userId: { boardId, userId }
			}
		});
		return row ? {
			boardId: row.boardId,
			userId: row.userId,
			role: row.role as BoardMember["role"],
			joinedAt: row.joinedAt
		} : null;
	}

	async	upsertMember(input: SetBoardMemberInput): Promise<BoardMember>
	{
		let	row;

		row = await this.prisma.boardMember.upsert({

			where: {
				boardId_userId: {
					boardId: input.boardId,
					userId: input.userId
				}
			},
			create: { boardId: input.boardId, userId: input.userId, role: input.role },
			update: { role: input.role }
		});
		return {
			boardId: row.boardId,
			userId: row.userId,
			role: row.role as BoardMember["role"],
			joinedAt: row.joinedAt
		};
	}

	async	update(input: UpdateBoardInput): Promise<Board>
	{
		let	row;

		row = await this.prisma.board.update({

			where: { id: input.boardId },
			data: {
				name: input.name?.trim(),
				description: input.description === undefined ? undefined : input.description?.trim() || null
			}
		});
		return mapBoard(row);
	}

	async	archive(boardId: string): Promise<Board>
	{
		let	row;

		row = await this.prisma.board.update({
			where: { id: boardId },
			data: { archivedAt: new Date() }
		});
		return mapBoard(row);
	}
}

function	mapBoard(row: {

	id: string;
	organizationId: string;
	createdByUserId: string;

	name: string;
	description: string | null;

	createdAt: Date;
	updatedAt: Date;
	archivedAt: Date | null
}): Board
{
	return {
		id: row.id,
		organizationId: row.organizationId,
		createdByUserId: row.createdByUserId,

		name: row.name,
		description: row.description,

		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		archivedAt: row.archivedAt
	};
}
