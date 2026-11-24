import { z } from "zod";

//            SHARED SCHEMAS            //
// ---- Request shape helpers ---- //

export const cardParamsSchema = z.object({
	cardId: z.string().min(1)
});

export const commentParamsSchema = cardParamsSchema.extend({
	commentId: z.string().min(1)
});

export const commentBodySchema = z.object({
	content: z.string().trim().min(1).max(5000)
});

//            SWAGGER UI                //
// ---- Shared response schemas ---- //

export const commentSchema = z.object({
	id: z.string(),
	cardId: z.string(),
	authorId: z.string(),

	content: z.string(),

	createdAt: z.date(),
	updatedAt: z.date(),
	deletedAt: z.date().nullable()
});

export const commentErrorSchema = z.object({
	error: z.string(),
	message: z.string()
});

//            SWAGGER UI                //
// ---- Per-endpoint documentation blocks ---- //

export const listCommentsDocs = {

	tags: ["Comments"],

	summary: "List a card's comments",

	description:
		"Returns every non-deleted comment on the card, oldest first. " +
		"The caller must have read access to the card (member of the card's board's organization, " +
		"or explicit board member). Returns 404 if the card does not exist or is not accessible " +
		"(existence is not leaked).",

	params: cardParamsSchema,

	response: {
		200: z.object({
			comments: z.array(commentSchema)
		}).describe("Comments on the card."),
		401: commentErrorSchema.describe("Authentication required."),
		404: commentErrorSchema.describe("Card not found or not accessible.")
	},

	security: []
} as const;

export const createCommentDocs = {

	tags: ["Comments"],

	summary: "Create a comment on a card",

	description:
		"Adds a comment to the card. The caller must have write access to the card " +
		"(board `member` or `admin`; observers are rejected with 403 `BOARD_READ_ONLY`). " +
		"`content` is trimmed; leading and trailing whitespace is removed before storage.",

	params: cardParamsSchema,

	body: commentBodySchema,

	response: {
		201: z.object({ comment: commentSchema }).describe("The created comment."),
		400: commentErrorSchema.describe("Validation error."),
		401: commentErrorSchema.describe("Authentication required."),
		403: commentErrorSchema.describe("Write access required (`BOARD_READ_ONLY` for observers)."),
		404: commentErrorSchema.describe("Card not found or not accessible.")
	},

	security: []
} as const;

export const updateCommentDocs = {

	tags: ["Comments"],

	summary: "Update a comment",

	description:
		"Replaces the content of an existing comment. " +
		"Requires write access to the parent card. " +
		"Any user with write access may update any comment on the card (the service does not restrict " +
		"updates to the comment's author). " +
		"Returns 404 if the comment does not exist on the given card.",

	params: commentParamsSchema,

	body: commentBodySchema,

	response: {
		200: z.object({ comment: commentSchema }).describe("The updated comment."),
		400: commentErrorSchema.describe("Validation error."),
		401: commentErrorSchema.describe("Authentication required."),
		403: commentErrorSchema.describe("Write access required."),
		404: commentErrorSchema.describe("Card or comment not found.")
	},

	security: []
} as const;

export const deleteCommentDocs = {

	tags: ["Comments"],

	summary: "Delete a comment",

	description:
		"Soft-deletes the comment (sets `deletedAt`; the row is retained). " +
		"Requires write access to the parent card. " +
		"Any user with write access may delete any comment on the card. " +
		"Returns 404 if the comment does not exist on the given card.",

	params: commentParamsSchema,

	response: {
		200: z.object({ ok: z.literal(true) }).describe("The comment was deleted."),
		401: commentErrorSchema.describe("Authentication required."),
		403: commentErrorSchema.describe("Write access required."),
		404: commentErrorSchema.describe("Card or comment not found.")
	},

	security: []
} as const;
