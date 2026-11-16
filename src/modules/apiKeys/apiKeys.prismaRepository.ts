import type { PrismaClient } from "@prisma/client";
import type { ApiKeysRepository } from "./apiKeys.repository.js";
import type { ApiKeyRecord } from "./apiKeys.types.js";

export	class	PrismaApiKeysRepository	implements	ApiKeysRepository
{
	constructor(private readonly prisma: PrismaClient) {}

	async	create(data: ApiKeyRecord): Promise<ApiKeyRecord>
	{
		return this.prisma.apiKey.create({ data });
	}

	async	findById(id: string): Promise<ApiKeyRecord | null>
	{
		return this.prisma.apiKey.findUnique({ where: { id } });
	}

	async	findByHashedKey(hashedKey: string): Promise<ApiKeyRecord | null>
	{
		return this.prisma.apiKey.findUnique({ where: { hashedKey } });
	}

	async	listByUser(userId: string): Promise<ApiKeyRecord[]>
	{
		return this.prisma.apiKey.findMany({
			where: { createdById: userId },
			orderBy: { createdAt: "desc" }
		});
	}

	async	revoke(id: string, revokedAt: Date): Promise<ApiKeyRecord>
	{
		return this.prisma.apiKey.update({
			where: { id },
			data: { revokedAt }
		});
	}
}
