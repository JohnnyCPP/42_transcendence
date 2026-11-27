import { defaultPagination } from "../../shared/pagination.js";
import { notFound } from "../../shared/errors/httpErrors.js";
import type { BoardList, CreateListInput, ReorderListsInput, UpdateListInput } from "./lists.types.js";
import type { BoardEventPublisher } from "../../ws/boardEvents.js";
import type { BoardsService } from "../boards/boards.service.js";
import type { ListsRepository } from "./lists.repository.js";
import type { Page, PaginationInput } from "../../shared/pagination.js";

export	class	ListsService
{
	constructor(private readonly listsRepository: ListsRepository,
				private readonly boardsService: BoardsService,
				private readonly boardEvents: BoardEventPublisher) {}

	async	createList(input: CreateListInput): Promise<BoardList>
	{
		let	list;

		await this.boardsService.getByBoardIdAndUserId(input.boardId, input.actorUserId, "write");
		list = await this.listsRepository.create(input);
		this.boardEvents.publish(list.boardId, { type: "list:created", list });
		return list;
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
		list = await this.listsRepository.update({ ...input, listId: list.id });
		this.boardEvents.publish(list.boardId, { type: "list:updated", list });
		return list;
	}

	async	reorderLists(input: ReorderListsInput): Promise<BoardList[]>
	{
		let	lists;

		await this.boardsService.getByBoardIdAndUserId(input.boardId, input.actorUserId, "write");
		lists = await this.listsRepository.reorder(input);
		for (const list of lists)
			this.boardEvents.publish(input.boardId, { type: "list:updated", list });
		return lists;
	}

	async archiveList(listId: string, actorUserId: string): Promise<BoardList>
	{
		let	list;

		list = await this.getByListIdAndUserId(listId, actorUserId, "write");
		list = await this.listsRepository.archive(list.id);
		this.boardEvents.publish(list.boardId, { type: "list:deleted", listId: list.id });
		return list;
	}
}
