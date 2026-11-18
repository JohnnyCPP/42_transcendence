import type { Board } from "../boards/boards.types.js";
import type { BoardList } from "../lists/lists.types.js";
import type { BoardsService } from "../boards/boards.service.js";
import type { Card } from "../cards/cards.types.js";
import type { CardsService } from "../cards/cards.service.js";
import type { ListsService } from "../lists/lists.service.js";

export	class	PublicApiService
{
	constructor(private readonly boardsService: BoardsService,
				private readonly listsService: ListsService,
				private readonly cardsService: CardsService) {}

	async	getBoardWithContents(boardId: string, userId: string): Promise<{
		board: Board;
		lists: BoardList[];
		cards: Card[];
	}>
	{
		let	board;
		let	lists;
		let	cards;
		let	list;
		let	listCards;

		board = await this.boardsService.getByBoardIdAndUserId(boardId, userId, "read");
		lists = await this.listsService.listAllByBoardId(board.id, userId);
		cards = [];
		for (list of lists)
		{
			listCards = await this.cardsService.listAllByListId(list.id, userId);
			cards.push(...listCards);
		}
		return {
			board,
			lists,
			cards
		};
	}
}
