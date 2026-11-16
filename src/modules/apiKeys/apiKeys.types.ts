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
