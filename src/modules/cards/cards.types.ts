import { z } from "zod";
export const cardPriorities = ['Low', 'Medium', 'Urgent', 'Enhancement', 'Complete'] as const;
export type CardPriority = typeof cardPriorities[number];

export	type	Card = {

	id: string;
	listId: string;
	createdById: string;

	title: string;
	priority: CardPriority;
	description: string | null;
	position: number;
	dueDate: Date | null;

	createdAt: Date;
	updatedAt: Date;
	archivedAt: Date | null;
};

export	type	CreateCardInput = {

	listId: string;
	actorUserId: string;

	title: string;
	priority?: CardPriority;
	description?: string | null;
	dueDate?: Date | null;
};

export	type	UpdateCardInput = {

	cardId: string;
	actorUserId: string;

	title?: string;
	priority?: CardPriority;
	description?: string | null;
	dueDate?: Date | null;
};

export	type	MoveCardInput = {

	cardId: string;
	actorUserId: string;
	targetListId: string;
};

export	type	ArchiveCardInput = {

	cardId: string;
	actorUserId: string;
};

export	const	cardSchema = z.object({

	id: z.string(),
	listId: z.string(),
	createdById: z.string(),

	title: z.string(),
	priority: z.enum(cardPriorities),
	description: z.string().nullable(),
	position: z.number().int(),
	dueDate: z.date().nullable(),

	createdAt: z.date(),
	updatedAt: z.date(),
	archivedAt: z.date().nullable()
});

export	const	cardErrorSchema = z.object({
	error: z.string(),
	message: z.string()
});

const	commonSessionErrors = {
	401: cardErrorSchema.describe("Authentication required."),
	404: cardErrorSchema.describe("Card or list not found, or not accessible to the caller.")
} as const;

export	const	createCardDocs = {

	tags: ["Cards"],

	summary: "Create a card",

	description:
		"Creates a card at the bottom of the given list. " +
		"The caller must have `write` access to the list (member or admin of the board). " +
		"New cards are appended after existing cards; use `POST /cards/:cardId/move` to reorder.",

	params: z.object({
		listId: z.string().min(1)
	}),

	body: z.object({
		title: z.string().trim().min(1).max(200),
		priority: z.enum(cardPriorities).optional(),
		description: z.string().trim().max(5000).optional().nullable(),
		dueDate: z.coerce.date().nullable().optional()
	}),

	response: {
		200: z.object({ card: cardSchema }).describe("The created card."),
		...commonSessionErrors,
		403: cardErrorSchema.describe("Observers have read-only access.")
	}
} as const;

export	const	listCardsDocs = {

	tags: ["Cards"],

	summary: "List cards in a list",

	description:
		"Returns a paginated, position-ordered list of active (non-archived) cards in the given list. " +
		"The caller must have at least `read` access to the list.",

	params: z.object({
		listId: z.string().min(1)
	}),

	response: {
		200: z.object({
			cards: z.array(cardSchema),
			pagination: z.object({
				limit: z.number().int(),
				offset: z.number().int(),
				total: z.number().int()
			})
		}).describe("Paginated cards in the list."),
		...commonSessionErrors
	}
} as const;

export	const	getCardDocs = {

	tags: ["Cards"],

	summary: "Get a card",

	description: "Returns a single card by id. Returns 404 if the card does not exist or the caller cannot access it.",

	params: z.object({
		cardId: z.string().min(1)
	}),

	response: {
		200: z.object({ card: cardSchema }).describe("The requested card."),
		...commonSessionErrors
	}
} as const;

export	const	updateCardDocs = {

	tags: ["Cards"],

	summary: "Update a card",

	description:
		"Partially updates a card. Only provided fields are changed. " +
		"The caller must have `write` access to the list containing the card.",

	params: z.object({
		cardId: z.string().min(1)
	}),

	body: z.object({
		title: z.string().trim().min(1).max(200).optional(),
		priority: z.enum(cardPriorities).optional(),
		description: z.string().trim().max(5000).optional().nullable(),
		dueDate: z.coerce.date().nullable().optional()
	}),

	response: {
		200: z.object({ card: cardSchema }).describe("The updated card."),
		...commonSessionErrors,
		403: cardErrorSchema.describe("Observers have read-only access.")
	}
} as const;

export	const	moveCardDocs = {

	tags: ["Cards"],

	summary: "Move a card to another list",

	description:
		"Moves the card to the bottom of the target list. " +
		"The caller must have `write` access to both the source list and the target list. " +
		"Positioning is computed server-side; clients do not specify a position.",

	params: z.object({
		cardId: z.string().min(1)
	}),

	body: z.object({
		targetListId: z.string().min(1)
	}),

	response: {
		200: z.object({ card: cardSchema }).describe("The moved card, with its new `listId` and `position`."),
		...commonSessionErrors,
		403: cardErrorSchema.describe("Observers have read-only access.")
	}
} as const;

export	const	archiveCardDocs = {

	tags: ["Cards"],

	summary: "Archive a card",

	description:
		"Soft-archives the card by setting `archivedAt`. The card stops appearing in list queries. " +
		"A second archive call returns 404, because archived cards are no longer readable. " +
		"The caller must have `write` access to the list containing the card.",

	params: z.object({
		cardId: z.string().min(1)
	}),

	response: {
		200: z.object({ ok: z.literal(true) } as const).describe("The card was archived."),
		...commonSessionErrors,
		403: cardErrorSchema.describe("Observers have read-only access.")
	}
} as const;
