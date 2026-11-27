import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../../src/app.js";

type App = Awaited<ReturnType<typeof buildApp>>;

// Abre un WebSocket contra la app y guarda los mensajes desde el primer
// instante (onInit), para no perder el "ready" que el servidor envía al conectar.
async	function	connect(app: App, cookie?: string)
{
	const	inbox: any[] = [];
	const	waiters: Array<{ match: (m: any) => boolean; resolve: (m: any) => void }> = [];
	let		closed: Promise<{ code: number; reason: string }> = Promise.resolve({ code: 0, reason: "" });

	const	ws = await app.injectWS("/ws", cookie ? { headers: { cookie } } : {}, {
		onInit(socket)
		{
			closed = new Promise((resolve) => socket.once("close", (code, reason) => resolve({ code, reason: reason.toString() })));
			socket.on("message", (raw) => {
				const	message = JSON.parse(raw.toString());
				const	index = waiters.findIndex((w) => w.match(message));

				if (index === -1)
					return void inbox.push(message);
				waiters.splice(index, 1)[0].resolve(message);
			});
		}
	});

	return {
		ws,
		closed: () => closed,
		next(match: (m: any) => boolean = () => true): Promise<any>
		{
			const	index = inbox.findIndex(match);

			if (index !== -1)
				return Promise.resolve(inbox.splice(index, 1)[0]);
			return new Promise((resolve) => waiters.push({ match, resolve }));
		}
	};
}

describe("websocket", () => {
	let	app: App;
	let	ownerCookie: string;
	let	ownerId: string;

	beforeAll(async () => {
		const	cookieName = process.env.SESSION_COOKIE_NAME ?? "sid";

		app = await buildApp();
		await app.ready();
		const	owner = await app.testContext.usersService.createUser({ username: "ws-owner" });
		ownerId = owner.id;
		ownerCookie = `${cookieName}=${(await app.testContext.sessionsService.createSession({ userId: owner.id })).token}`;
	});

	afterAll(async () => { await app.close(); });

	it("accepts a valid session cookie and sends ready", async () => {
		const	client = await connect(app, ownerCookie);

		expect(await client.next()).toEqual({ type: "ready", user: { id: ownerId, username: "ws-owner", displayName: null } });
		client.ws.terminate();
	});

	it("closes with 4401 when the cookie is missing or invalid", async () => {
		const	missing = await connect(app);
		const	invalid = await connect(app, "sid=not-a-real-token");

		expect(await missing.closed()).toEqual({ code: 4401, reason: "Unauthorized" });
		expect(await invalid.closed()).toEqual({ code: 4401, reason: "Unauthorized" });
	});
});
