import { createHash, randomUUID } from "node:crypto";
import { notFound } from "../../shared/errors/httpErrors.js";
import { generateApiKey } from "../../shared/crypto/generateApiKey.js";
import { hashToken } from "../../shared/crypto/hashToken.js";
import type { ApiKeysRepository } from "./apiKeys.repository.js";
import type { ApiKeyPublic, ApiKeyRecord, CreateApiKeyResult } from "./apiKeys.types.js";

export	class	ApiKeysService
{
	constructor(private readonly apiKeysRepository: ApiKeysRepository) {}

	async	create(userId: string, name: string): Promise<CreateApiKeyResult>
	{
		const	{ plaintext, prefix } = generateApiKey();
		const	record: ApiKeyRecord = {

			id: randomUUID(),
			createdById: userId,

			name,
			prefix,
			hashedKey: hashToken(plaintext),

			createdAt: new Date(),
			lastUsedAt: null,
			revokedAt: null
		};
		const	created = await this.apiKeysRepository.create(record);

		return {
			apiKey: this.toPublic(created),
			plaintextKey: plaintext
		};
	}

	async	list(userId: string): Promise<ApiKeyPublic[]>
	{
		const	rows = await this.apiKeysRepository.listByUser(userId);

		return rows.sort((a, b) => {

					const byDate = b.createdAt.getTime() - a.createdAt.getTime();

					if (byDate !== 0)
						return byDate;
					return b.id.localeCompare(a.id);
				})
				   .map((row) => this.toPublic(row));
	}

	async	revoke(userId: string, id: string): Promise<ApiKeyPublic>
	{
		const	existing = await this.apiKeysRepository.findById(id);

		if (!existing || existing.createdById !== userId)
		{
			throw notFound("API key not found", "API_KEY_NOT_FOUND");
		}
		if (existing.revokedAt)
		{
			return this.toPublic(existing);
		}
		const	revoked = await this.apiKeysRepository.revoke(id, new Date());

		return this.toPublic(revoked);
	}

	private	toPublic(record: ApiKeyRecord): ApiKeyPublic
	{
		return {

			id: record.id,

			name: record.name,
			prefix: record.prefix,

			createdAt: record.createdAt,
			lastUsedAt: record.lastUsedAt,
			revokedAt: record.revokedAt
		};
	}
}
