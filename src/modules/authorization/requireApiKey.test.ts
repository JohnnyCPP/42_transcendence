import { buildApp } from "../../app.js";
import { describe, it, expect, beforeEach } from "vitest";
import { hashToken } from "../../shared/crypto/hashToken.js";

describe("requireApiKey middleware", () =>
{
	let	app: Awaited<ReturnType<typeof buildApp>>;
	let	ownerId: string;
	let	adminId: string;
	let	apiKeyPlaintext: string;
	let	apiKeyId: string;

	beforeEach(async () =>
	{
		app = await buildApp();
		await app.ready();

		const	ctx = app.testContext;
		const	owner = await ctx.usersService.createUser({
			username: "apikey-tester"
		});
		ownerId = owner.id;
		const	admin = await ctx.usersService.createUser({
			username: "apikey-admin"
		});
		adminId = admin.id;
		await ctx.usersRepository.updateManaged(adminId, { role: "admin" });
		const	created = await ctx.apiKeysService.create(ownerId, "test key");
		apiKeyPlaintext = created.plaintextKey;
		apiKeyId = created.apiKey.id;
	});

	async	function	hit(header?: string)
	{
		return app.inject({
			method: "GET",
			url: "/__test/api-key-ping",
			headers: header ? { "x-api-key": header } : {}
		});
	}

	it("accepts a valid key and attaches currentUser + apiKey", async () =>
	{
		const	res = await hit(apiKeyPlaintext);

		expect(res.statusCode).toBe(200);
		expect(res.json()).toEqual({ userId: ownerId, keyId: apiKeyId });
	});

	it("rejects missing header with 401", async () =>
	{
		const	res = await hit();

		expect(res.statusCode).toBe(401);
		expect(res.json().error).toBe("UNAUTHORIZED");
	});

	it("rejects a key without the tfk_ prefix", async () =>
	{
		const	res = await hit("not-a-tfk-key");

		expect(res.statusCode).toBe(401);
		expect(res.json().error).toBe("UNAUTHORIZED");
	});

	it("rejects an unknown well-formed key", async () =>
	{
		const	res = await hit("tfk_" + "A".repeat(43));

		expect(res.statusCode).toBe(401);
		expect(res.json().error).toBe("UNAUTHORIZED");
	});

	it("rejects a revoked key", async () =>
	{
		const	ctx = app.testContext;

		await ctx.apiKeysService.revoke(ownerId, apiKeyId);
		const	res = await hit(apiKeyPlaintext);
		expect(res.statusCode).toBe(401);
	});

	it("rejects when the key owner is deactivated", async () =>
	{
		const	ctx = app.testContext;

		await ctx.usersService.updateManagedUser(adminId, ownerId, { status: "disabled" });
		const	res = await hit(apiKeyPlaintext);
		expect(res.statusCode).toBe(401);
	});

	it("updates lastUsedAt but not on every request", async () =>
	{
		const	ctx = app.testContext;

		await hit(apiKeyPlaintext);
		const	after1 = (await ctx.apiKeysService.findByHashedKey(hashToken(apiKeyPlaintext)))!.lastUsedAt;
		expect(after1).toBeInstanceOf(Date);
		await hit(apiKeyPlaintext);
		const	after2 = (await ctx.apiKeysService.findByHashedKey(hashToken(apiKeyPlaintext)))!.lastUsedAt;
		expect(after2!.getTime()).toBe(after1!.getTime());
	});
});
