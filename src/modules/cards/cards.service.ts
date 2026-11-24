import { defaultPagination } from "../../shared/pagination.js";
import { notFound } from "../../shared/errors/httpErrors.js";
import type { ArchiveCardInput, Card, CreateCardInput, MoveCardInput, UpdateCardInput } from "./cards.types.js";
import type { CardsRepository } from "./cards.repository.js";
import type { ListsService } from "../lists/lists.service.js";
import type { Page, PaginationInput } from "../../shared/pagination.js";

export	class	CardsService
{
	constructor(private readonly cardsRepository: CardsRepository,
				private readonly listsService: ListsService) {}

	async	createCard(input: CreateCardInput): Promise<Card>
	{
		await this.listsService.getByListIdAndUserId(input.listId, input.actorUserId, "write");
		return this.cardsRepository.create(input);
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
		let	card;

		card = await this.cardsRepository.findById(cardId);
		if (!card)
			throw notFound("Card not found", "CARD_NOT_FOUND");
		await this.listsService.getByListIdAndUserId(card.listId, actorUserId, permission);
		return card;
	}

	async	updateCard(input: UpdateCardInput): Promise<Card>
	{
		let	card;

		card = await this.getCardForUser(input.cardId, input.actorUserId, "write");
		return this.cardsRepository.update({ ...input, cardId: card.id });
	}

	async	moveCard(input: MoveCardInput): Promise<Card>
	{
		let	card;

		card = await this.getCardForUser(input.cardId, input.actorUserId, "write");
		await this.listsService.getByListIdAndUserId(input.targetListId, input.actorUserId, "write");
		return this.cardsRepository.move({ ...input, cardId: card.id });
	}

	async	archiveCard(input: ArchiveCardInput): Promise<Card>
	{
		let	card;

		card = await this.getCardForUser(input.cardId, input.actorUserId, "write");
		return this.cardsRepository.archive(card.id);
	}
}
