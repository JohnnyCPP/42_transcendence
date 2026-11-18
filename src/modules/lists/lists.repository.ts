import { badRequest } from "../../shared/errors/httpErrors.js";
import { createRandomToken } from "../../shared/crypto/createRandomToken.js";
import { paginateArray } from "../../shared/pagination.js";
import type { BoardList, CreateListInput, ReorderListsInput, UpdateListInput } from "./lists.types.js";
import type { Page, PaginationInput } from "../../shared/pagination.js";

export	interface	ListsRepository
{
	create(input: CreateListInput): Promise<BoardList>;

	listByBoardId(boardId: string, pagination: PaginationInput): Promise<Page<BoardList>>;

	listAllByBoardId(boardId: string): Promise<BoardList[]>;

	findById(listId: string): Promise<BoardList | null>;

	update(input: UpdateListInput): Promise<BoardList>;

	reorder(input: ReorderListsInput): Promise<BoardList[]>;
}

export	class	InMemoryListsRepository	implements	ListsRepository
{
	private	readonly	lists = new Map<string, BoardList>();

	async	create(input: CreateListInput): Promise<BoardList>
	{
		let	now;
		let	currentLists;
		let	nextPosition;
		let	list;

		now = new Date();
		currentLists = this.getActiveLists(input.boardId);
		nextPosition = currentLists.length ? Math.max(...currentLists.map((item) => item.position)) + 1000 : 1000;
		list = {

			id: createRandomToken(16),
			boardId: input.boardId,

			name: input.name.trim(),
			position: nextPosition,

			createdAt: now,
			updatedAt: now,
			archivedAt: null
		};
		this.lists.set(list.id, list);
		return list;
	}

	async	listByBoardId(boardId: string, pagination: PaginationInput): Promise<Page<BoardList>>
	{
		return paginateArray(this.getActiveLists(boardId), pagination);
	}

	async	listAllByBoardId(boardId: string): Promise<BoardList[]>
	{
		return this.getActiveLists(boardId);
	}

	async	findById(listId: string): Promise<BoardList | null>
	{
		let	list;

		list = this.lists.get(listId);
		if (!list || list.archivedAt)
			return null;
		return list;
	}

	async	update(input: UpdateListInput): Promise<BoardList>
	{
		let	list;

		list = this.lists.get(input.listId);
		if (!list || list.archivedAt)
			throw new Error("List not found");
		list.name = input.name?.trim() ?? list.name;
		list.updatedAt = new Date();
		return list;
	}

	async	reorder(input: ReorderListsInput): Promise<BoardList[]>
	{
		let	currentLists;
		let	now;
		let	list;

		currentLists = this.getActiveLists(input.boardId);
		assertSameListSet(currentLists.map((list) => list.id), input.listIds);
		now = new Date();
		input.listIds.forEach((listId, index) =>
		{
			list = this.lists.get(listId)!;
			list.position = (index + 1) * 1000;
			list.updatedAt = now;
		});
		return this.getActiveLists(input.boardId);
	}

	private	getActiveLists(boardId: string): BoardList[]
	{
		return [...this.lists.values()]
			.filter((list) => list.boardId === boardId && !list.archivedAt)
			.sort((left, right) => left.position - right.position);
	}
}

export	function	assertSameListSet(currentIds: string[], requestedIds: string[]): void
{
	let	current;
	let	requested;
	let	id;

	if (currentIds.length !== requestedIds.length)
	{
		throw badRequest("Reorder must include every active list exactly once", "INVALID_LIST_REORDER");
	}
	current = new Set(currentIds);
	requested = new Set(requestedIds);
	if (requested.size !== requestedIds.length)
	{
		throw badRequest("Reorder contains duplicate list ids", "INVALID_LIST_REORDER");
	}
	for (id of current)
	{
		if (!requested.has(id))
		{
			throw badRequest("Reorder must include every active list exactly once", "INVALID_LIST_REORDER");
		}
	}
}
