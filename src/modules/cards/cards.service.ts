import { defaultPagination } from "../../shared/pagination.js";
import { notFound } from "../../shared/errors/httpErrors.js";
import type { ArchiveCardInput, Card, CreateCardInput, MoveCardInput, UpdateCardInput } from "./cards.types.js";
import type { CardsRepository } from "./cards.repository.js";
import type { BoardEventPublisher } from "../../ws/boardEvents.js";
import type { BoardList } from "../lists/lists.types.js";
import type { ListsService } from "../lists/lists.service.js";
import type { Page, PaginationInput } from "../../shared/pagination.js";

export	class	CardsService
{
	constructor(private readonly cardsRepository: CardsRepository,
				private readonly listsService: ListsService,
				private readonly boardEvents: BoardEventPublisher) {}

	async	createCard(input: CreateCardInput): Promise<Card>
	{
		let	list;
		let	card;

		list = await this.listsService.getByListIdAndUserId(input.listId, input.actorUserId, "write");
		card = await this.cardsRepository.create(input);
		this.boardEvents.publish(list.boardId, { type: "card:created", card });
		return card;
	}

	async	listCardsByListId(listId: string, actorUserId: string, pagination: PaginationInput = defaultPagination): Promise<Page<Card>>
	{
		await this.listsService.getByListIdAndUserId(listId, actorUserId);
		return this.cardsRepository.listByListId(listId, pagination);
	}

	async	listAllByListId(listId: string, actorUserId: string): Promise<Card[]>
	{
		await this.listsService.getByListIdAndUserId(listId, actorUserId, "read");
		return this.cardsRepository.listAllByListId(listId);
	}

	async	getCardForUser(cardId: string,
						   actorUserId: string,
						   permission: "read" | "write" = "read"): Promise<Card>
	{
		return (await this.getCardWithList(cardId, actorUserId, permission)).card;
	}

	async	updateCard(input: UpdateCardInput): Promise<Card>
	{
		let	card;
		const	{ card: current, list } = await this.getCardWithList(input.cardId, input.actorUserId, "write");

		card = await this.cardsRepository.update({ ...input, cardId: current.id });
		this.boardEvents.publish(list.boardId, { type: "card:updated", card });
		return card;
	}

	async	moveCard(input: MoveCardInput): Promise<Card>
	{
		let	card;
		const	{ card: current, list: sourceList } = await this.getCardWithList(input.cardId, input.actorUserId, "write");
		const	targetList = await this.listsService.getByListIdAndUserId(input.targetListId, input.actorUserId, "write");

		// Se guarda antes de mover: el repositorio puede modificar el mismo objeto.
		const	fromListId = sourceList.id;
		card = await this.cardsRepository.move({ ...input, cardId: current.id });
		this.boardEvents.publish(targetList.boardId, { type: "card:moved", card, fromListId });
		// Si cambia de tablero, en el de origen la tarjeta simplemente desaparece.
		if (sourceList.boardId !== targetList.boardId)
			this.boardEvents.publish(sourceList.boardId, { type: "card:deleted", cardId: card.id, listId: fromListId });
		return card;
	}

	async	archiveCard(input: ArchiveCardInput): Promise<Card>
	{
		let	card;
		const	{ card: current, list } = await this.getCardWithList(input.cardId, input.actorUserId, "write");

		card = await this.cardsRepository.archive(current.id);
		this.boardEvents.publish(list.boardId, { type: "card:deleted", cardId: card.id, listId: card.listId });
		return card;
	}

	// Como getCardForUser, pero devuelve también la lista que ya se carga para
	// comprobar permisos: de ahí sale el boardId de los eventos sin otra consulta.
	private	async	getCardWithList(cardId: string,
									actorUserId: string,
									permission: "read" | "write"): Promise<{ card: Card; list: BoardList }>
	{
		let	card;
		let	list;

		card = await this.cardsRepository.findById(cardId);
		if (!card)
			throw notFound("Card not found", "CARD_NOT_FOUND");
		list = await this.listsService.getByListIdAndUserId(card.listId, actorUserId, permission);
		return { card, list };
	}
}
