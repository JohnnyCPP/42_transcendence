import { z } from "zod";

export	interface	ApiKeyRecord
{
	id: string;
	createdById: string;

	name: string;
	prefix: string;
	hashedKey: string;

	createdAt: Date;
	lastUsedAt: Date | null;
	revokedAt: Date | null;
}

export	interface	ApiKeyPublic
{
	id: string;

	name: string;
	prefix: string;

	createdAt: Date;
	lastUsedAt: Date | null;
	revokedAt: Date | null;
}

export	interface	CreateApiKeyResult
{
	apiKey: ApiKeyPublic;
	plaintextKey: string;
}

export	const	apiKeyPublicSchema = z.object({

	id: z.string(),

	name: z.string(),
	prefix: z.string(),

	createdAt: z.date(),
	lastUsedAt: z.date().nullable(),
	revokedAt: z.date().nullable()
});

export	const	createApiKeyResultSchema = z.object({
	apiKey: apiKeyPublicSchema,
	plaintextKey: z.string()
});

export	const	apiKeyErrorSchema = z.object({
	error: z.string(),
	message: z.string()
});

export	const	createApiKeyDocs = {

	tags: ["API Keys"],

	summary: "Create an API key",

	description:
		"Creates a new API key for the authenticated user. " +
		"The plaintext key is returned exactly once in `plaintextKey` and cannot be retrieved again. " +
		"Store it securely immediately. Only the SHA-256 hash and a short prefix are persisted.",

	body: z.object({
		name: z.string().trim().min(1).max(64)
	}),

	response: {
		201: createApiKeyResultSchema.describe("The created key plus its one-time plaintext."),
		400: apiKeyErrorSchema.describe("Validation error."),
		401: apiKeyErrorSchema.describe("Authentication required.")
	}
} as const;

export	const	listApiKeysDocs = {

	tags: ["API Keys"],

	summary: "List your API keys",

	description:
		"Returns all API keys created by the authenticated user, newest first. " +
		"Neither the plaintext key nor its hash is ever returned — only metadata.",

	response: {
		200: z.array(apiKeyPublicSchema).describe("The caller's API keys."),
		401: apiKeyErrorSchema.describe("Authentication required")
	}
} as const;

export	const	revokeApiKeyDocs = {

	tags: ["API Keys"],

	summary: "Revoke an API key",

	description:
		"Revokes an API key owned by the caller. The key stops authenticating immediately. " +
		"Revocation is idempotent: Revoking an already-revoked key returns the same record. " +
		"Returns 404 if the key does not exist or belongs to another user (existence is not leaked).",

	params: z.object({
		id: z.string().uuid()
	}),

	response: {
		200: apiKeyPublicSchema.describe("The revoked key record."),
		401: apiKeyErrorSchema.describe("Authentication required."),
		404: apiKeyErrorSchema.describe("API key not found or not owned by the caller.")
	}
} as const;
