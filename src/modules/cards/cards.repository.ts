import { createRandomToken } from "../../shared/crypto/createRandomToken.js";
import { paginateArray } from "../../shared/pagination.js";
import type { Page, PaginationInput } from "../../shared/pagination.js";
import type { Card, CreateCardInput, MoveCardInput, UpdateCardInput } from "./cards.types.js";

export	interface	CardsRepository
{
	create(input: CreateCardInput): Promise<Card>;

	listByListId(listId: string, pagination: PaginationInput): Promise<Page<Card>>;

	listAllByListId(listId: string): Promise<Card[]>;

	findById(cardId: string): Promise<Card | null>;

	update(input: UpdateCardInput): Promise<Card>;

	move(input: MoveCardInput): Promise<Card>;

	archive(cardId: string): Promise<Card>;
}

export	class	InMemoryCardsRepository	implements	CardsRepository
{
	private	readonly	cards = new Map<string, Card>();

	async	create(input: CreateCardInput): Promise<Card>
	{
		let	now;
		let	cards;
		let	card;

		now = new Date();
		cards = this.getActiveCards(input.listId);
		card = {
			id: createRandomToken(16),
			listId: input.listId,
			createdById: input.actorUserId,

			title: input.title.trim(),
			priority: input.priority ?? 'Low',
			description: input.description?.trim() || null,
			position: cards.length ? Math.max(...cards.map((item) => item.position)) + 1000 : 1000,
			dueDate: input.dueDate ?? null,

			createdAt: now,
			updatedAt: now,
			archivedAt: null
		};
		this.cards.set(card.id, card);
		return card;
	}

	async	listByListId(listId: string, pagination: PaginationInput): Promise<Page<Card>>
	{
		return paginateArray(this.getActiveCards(listId), pagination);
	}

	async	listAllByListId(listId: string): Promise<Card[]>
	{
		return this.getActiveCards(listId);
	}

	async	findById(cardId: string): Promise<Card | null>
	{
		let	card;

		card = this.cards.get(cardId);
		if (!card || card.archivedAt)
			return null;
		return card;
	}

	async	update(input: UpdateCardInput): Promise<Card>
	{
		let	card;

		card = this.cards.get(input.cardId);
		if (!card || card.archivedAt)
			throw new Error("Card not found");
		card.title = input.title?.trim() ?? card.title;
		card.priority = input.priority ?? card.priority;
		card.description = input.description === undefined ? card.description : input.description?.trim() || null;
		card.dueDate = input.dueDate === undefined ? card.dueDate : input.dueDate;
		card.updatedAt = new Date();
		return card;
	}

	async	move(input: MoveCardInput): Promise<Card>
	{
		let	card;
		let	targetCards;

		card = this.cards.get(input.cardId);
		if (!card || card.archivedAt)
			throw new Error("Card not found");
		targetCards = this.getActiveCards(input.targetListId);
		card.listId = input.targetListId;
		card.position = targetCards.length ? Math.max(...targetCards.map((item) => item.position)) + 1000 : 1000;
		card.updatedAt = new Date();
		return card;
	}

	async	archive(cardId: string): Promise<Card>
	{
		let	card;

		card = this.cards.get(cardId);
		if (!card || card.archivedAt)
			throw new Error("Card not found");
		card.archivedAt = new Date();
		card.updatedAt = new Date();
		return card;
	}

	private	getActiveCards(listId: string): Card[]
	{
		return [...this.cards.values()]
			.filter((card) => card.listId === listId && !card.archivedAt)
			.sort((left, right) => left.position - right.position);
	}
}
