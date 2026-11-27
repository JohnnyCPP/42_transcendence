/**
 * Eventos en tiempo real de un tablero (Story 5.3).
 *
 * Los servicios de listas y tarjetas publican estos eventos después de
 * guardar cada cambio. Solo conocen la interfaz BoardEventPublisher, no
 * los WebSockets: BoardRooms la implementa enviando el evento a la sala
 * del tablero, y noopBoardEvents la implementa sin hacer nada.
 */
import type { BoardList } from "../modules/lists/lists.types.js";
import type { Card } from "../modules/cards/cards.types.js";

export	type	BoardEvent =
	| { type: "card:created"; card: Card }
	| { type: "card:updated"; card: Card }
	| { type: "card:moved"; card: Card; fromListId: string }
	| { type: "card:deleted"; cardId: string; listId: string }
	| { type: "list:created"; list: BoardList }
	| { type: "list:updated"; list: BoardList }
	| { type: "list:deleted"; listId: string };

export	interface	BoardEventPublisher
{
	publish(boardId: string, event: BoardEvent): void;
}

export	const	noopBoardEvents: BoardEventPublisher = { publish: () => {} };
