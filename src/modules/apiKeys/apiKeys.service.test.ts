import { describe, expect, it } from "vitest";
import { InMemoryApiKeysRepository } from "./apiKeys.repository.js";
import { ApiKeysService } from "./apiKeys.service.js";

describe("ApiKeysService", () =>
{
	function	createService()
	{
		return new ApiKeysService(new InMemoryApiKeysRepository());
	}

	describe("create", () =>
	{
		it("returns plaintext exactly once, with the correct format", async () =>
		{
			const	service = createService();
			const	result = await service.create("user-1", "CI key");

			expect(result.plaintextKey).toMatch(/^tfk_[A-Za-z0-9_-]{43}$/);
			expect(result.apiKey.prefix).toBe(result.plaintextKey.slice(0, 10));
		});

		it("never exposes hashedKey or plaintextKey in the public object", async () =>
		{
			const	service = createService();
			const	result = await service.create("user-1", "CI key");

			expect(result.apiKey).not.toHaveProperty("hashedKey");
			expect(result.apiKey).not.toHaveProperty("plaintextKey");
		});
	});

	describe("list", () =>
	{
		it("returns only the caller's keys, newest first", async () =>
		{
			const	service = createService();

			await service.create("user-1", "first");
			await new Promise((r) => setTimeout(r, 5));
			await service.create("user-2", "other user");
			await new Promise((r) => setTimeout(r, 5));
			await service.create("user-1", "second");
			const	list = await service.list("user-1");
			expect(list).toHaveLength(2);
			expect(list.map((k) => k.name)).toEqual(["second", "first"]);
		});

		it("strips plaintext and hash from every listed key", async () =>
		{
			const	service = createService();

			await service.create("user-1", "a");
			const	[key] = await service.list("user-1");
			expect(key).not.toHaveProperty("hashedKey");
			expect(key).not.toHaveProperty("plaintextKey");
		});
	});

	describe("revoke", () =>
	{
		it("sets revokedAt and is idempotent", async () =>
		{
			const	service = createService();
			const	{ apiKey } = await service.create("user-1", "a");
			const	revoked = await service.revoke("user-1", apiKey.id);

			expect(revoked.revokedAt).toBeInstanceOf(Date);
			const	again = await service.revoke("user-1", apiKey.id);
			expect(again.revokedAt?.getTime()).toBe(revoked.revokedAt?.getTime());
		});

		it("returns 404-shaped error for another user's key", async () =>
		{
			const	service = createService();
			const	{ apiKey } = await service.create("user-1", "a");

			await expect(service.revoke("user-2", apiKey.id))
						.rejects.toThrow(/API key not found/);
		});
	});
});
