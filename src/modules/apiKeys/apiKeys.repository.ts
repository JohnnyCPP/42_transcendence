import type { ApiKeyRecord } from "./apiKeys.types.js";

export	interface	ApiKeysRepository
{
	create(data: ApiKeyRecord): Promise<ApiKeyRecord>;

	findById(id: string): Promise<ApiKeyRecord | null>;

	findByHashedKey(hashedKey: string): Promise<ApiKeyRecord | null>;

	listByUser(userId: string): Promise<ApiKeyRecord[]>;

	revoke(id: string, revokedAt: Date): Promise<ApiKeyRecord>;

	updateLastUsedAt(id: string, lastUsedAt: Date): Promise<void>;
}

export	class	InMemoryApiKeysRepository	implements	ApiKeysRepository
{
	private	readonly	rows = new Map<string, ApiKeyRecord>();

	async	create(data: ApiKeyRecord): Promise<ApiKeyRecord>
	{
		for (const existing of this.rows.values())
		{
			if (existing.prefix === data.prefix)
				throw new Error("UNIQUE_CONSTRAINT_PREFIX");
			if (existing.hashedKey === data.hashedKey)
				throw new Error("UNIQUE_CONSTRAINT_HASHED_KEY");
		}
		this.rows.set(data.id, { ...data });
		return { ...data };
	}

	async	findById(id: string): Promise<ApiKeyRecord | null>
	{
		const	row = this.rows.get(id);

		return row ? { ...row } : null;
	}

	async	findByHashedKey(hashedKey: string): Promise<ApiKeyRecord | null>
	{
		for (const row of this.rows.values())
		{
			if (row.hashedKey === hashedKey)
				return { ...row };
		}
		return null;
	}

	async	listByUser(userId: string): Promise<ApiKeyRecord[]>
	{
		return Array.from(this.rows.values())
					.filter((row) => row.createdById === userId)
					.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
					.map((row) => ({ ...row }));
	}

	async	revoke(id: string, revokedAt: Date): Promise<ApiKeyRecord>
	{
		const	row = this.rows.get(id);

		if (!row)
			throw new Error("API_KEY_NOT_FOUND");
		row.revokedAt = revokedAt;
		return { ...row };
	}

	async	updateLastUsedAt(id: string, lastUsedAt: Date): Promise<void>
	{
		const	row = this.rows.get(id);

		// in case the row was removed concurrently
		if (!row)
			return;
		row.lastUsedAt = lastUsedAt;
	}
}
