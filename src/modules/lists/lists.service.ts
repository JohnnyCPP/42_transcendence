import { defaultPagination } from "../../shared/pagination.js";
import { notFound } from "../../shared/errors/httpErrors.js";
import type { BoardList, CreateListInput, ReorderListsInput, UpdateListInput } from "./lists.types.js";
import type { BoardsService } from "../boards/boards.service.js";
import type { ListsRepository } from "./lists.repository.js";
import type { Page, PaginationInput } from "../../shared/pagination.js";

export	class	ListsService
{
	constructor(private readonly listsRepository: ListsRepository,
				private readonly boardsService: BoardsService) {}

	async	createList(input: CreateListInput): Promise<BoardList>
	{
		await this.boardsService.getByBoardIdAndUserId(input.boardId, input.actorUserId, "write");
		return this.listsRepository.create(input);
	}

	async	listByBoardId(boardId: string, actorUserId: string, pagination: PaginationInput = defaultPagination): Promise<Page<BoardList>>
	{
		await this.boardsService.getByBoardIdAndUserId(boardId, actorUserId);
		return this.listsRepository.listByBoardId(boardId, pagination);
	}

	async	listAllByBoardId(boardId: string, actorUserId: string): Promise<BoardList[]>
	{
		await this.boardsService.getByBoardIdAndUserId(boardId, actorUserId, "read");
		return this.listsRepository.listAllByBoardId(boardId);
	}

	async	getByListIdAndUserId(listId: string,
								 actorUserId: string,
								 permission: "read" | "write" = "read"): Promise<BoardList>
	{
		let	list;

		list = await this.listsRepository.findById(listId);
		if (!list)
			throw notFound("List not found", "LIST_NOT_FOUND");
		await this.boardsService.getByBoardIdAndUserId(list.boardId, actorUserId, permission);
		return list;
	}

	async	updateList(input: UpdateListInput): Promise<BoardList>
	{
		let	list;

		list = await this.getByListIdAndUserId(input.listId, input.actorUserId, "write");
		return this.listsRepository.update({ ...input, listId: list.id });
	}

	async	reorderLists(input: ReorderListsInput): Promise<BoardList[]>
	{
		await this.boardsService.getByBoardIdAndUserId(input.boardId, input.actorUserId, "write");
		return this.listsRepository.reorder(input);
	}
}
