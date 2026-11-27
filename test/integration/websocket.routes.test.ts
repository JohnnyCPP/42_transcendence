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
	let	memberCookie: string;
	let	strangerCookie: string;
	let	boardId: string;
	let	orgId: string;

	beforeAll(async () => {
		const	cookieName = process.env.SESSION_COOKIE_NAME ?? "sid";

		app = await buildApp();
		await app.ready();
		const	owner = await app.testContext.usersService.createUser({ username: "ws-owner" });
		const	member = await app.testContext.usersService.createUser({ username: "ws-member" });
		const	stranger = await app.testContext.usersService.createUser({ username: "ws-stranger" });
		ownerId = owner.id;
		ownerCookie = `${cookieName}=${(await app.testContext.sessionsService.createSession({ userId: owner.id })).token}`;
		memberCookie = `${cookieName}=${(await app.testContext.sessionsService.createSession({ userId: member.id })).token}`;
		strangerCookie = `${cookieName}=${(await app.testContext.sessionsService.createSession({ userId: stranger.id })).token}`;
		// El owner crea una organización con un tablero y añade a "member" a la organización.
		// "stranger" no pertenece a ella, así que no puede ver el tablero.
		const	org = await app.testContext.organizationsService.createOrganization({ name: "WS org", createdByUserId: owner.id });
		const	board = await app.inject({ method: "POST", url: `/api/v1/organizations/${org.id}/boards`, headers: { cookie: ownerCookie }, payload: { name: "Board" } });
		boardId = board.json().board.id;
		orgId = org.id;
		const	added = await app.inject({ method: "PUT", url: `/api/v1/organizations/${org.id}/members/${member.id}`, headers: { cookie: ownerCookie }, payload: { role: "member" } });
		expect(added.statusCode).toBe(200);
	});

	afterAll(async () => { await app.close(); });

	it("accepts a valid session cookie and sends ready", async () => {
		const	client = await connect(app, ownerCookie);

		expect(await client.next()).toEqual({ type: "ready", user: { id: ownerId, username: "ws-owner", displayName: null } });
		client.ws.terminate();
	});

	it("tracks connected sockets and records pongs for the heartbeat", async () => {
		const	sockets = app.testContext.boardRooms.sockets;
		const	existing = new Set(sockets);
		const	client = await connect(app, ownerCookie);

		await client.next((m) => m.type === "ready");
		// El socket del servidor de esta conexión es el único que no estaba antes.
		const	server = [...sockets].find((socket) => !existing.has(socket))!;
		const	before = server.lastPongAt;

		// injectWS crea el cliente sin autoPong: aquí se contesta a mano, como haría el navegador.
		client.ws.on("ping", () => client.ws.pong());
		await new Promise((resolve) => setTimeout(resolve, 5));
		await new Promise<void>((resolve) => { server.once("pong", () => resolve()); server.ping(); });
		expect(server.lastPongAt).toBeGreaterThan(before);
		client.ws.terminate();
		await new Promise((resolve) => setTimeout(resolve, 20));
		expect(sockets.has(server)).toBe(false);
	});

	it("closes with 4401 when the cookie is missing or invalid", async () => {
		const	missing = await connect(app);
		const	invalid = await connect(app, "sid=not-a-real-token");

		expect(await missing.closed()).toEqual({ code: 4401, reason: "Unauthorized" });
		expect(await invalid.closed()).toEqual({ code: 4401, reason: "Unauthorized" });
	});

	it("rejects subscriptions to boards the user is not a member of", async () => {
		const	client = await connect(app, strangerCookie);

		await client.next((m) => m.type === "ready");
		client.ws.send(JSON.stringify({ type: "subscribe:board", boardId }));
		expect(await client.next()).toMatchObject({ type: "error", code: "BOARD_FORBIDDEN", boardId });
		client.ws.terminate();
	});

	it("rejects malformed messages without closing the socket", async () => {
		const	client = await connect(app, ownerCookie);

		await client.next((m) => m.type === "ready");
		client.ws.send("not json");
		expect(await client.next()).toMatchObject({ type: "error", code: "INVALID_JSON" });
		client.ws.send(JSON.stringify({ type: "dance" }));
		expect(await client.next()).toMatchObject({ type: "error", code: "INVALID_MESSAGE" });
		client.ws.terminate();
	});

	it("announces presence:joined and presence:left to the room", async () => {
		const	first = await connect(app, ownerCookie);
		const	second = await connect(app, memberCookie);

		await first.next((m) => m.type === "ready");
		await second.next((m) => m.type === "ready");
		first.ws.send(JSON.stringify({ type: "subscribe:board", boardId }));
		await first.next((m) => m.type === "presence:state");
		second.ws.send(JSON.stringify({ type: "subscribe:board", boardId }));
		const	state = await second.next((m) => m.type === "presence:state");
		expect(state.users.map((u: any) => u.username).sort()).toEqual(["ws-member", "ws-owner"]);
		expect(await first.next((m) => m.type === "presence:joined")).toMatchObject({ boardId, user: { username: "ws-member" } });
		second.ws.terminate();
		expect(await first.next((m) => m.type === "presence:left")).toMatchObject({ boardId, user: { username: "ws-member" } });
		first.ws.terminate();
	});

	it("treats several tabs of the same user as a single presence", async () => {
		const	watcher = await connect(app, ownerCookie);
		const	tabA = await connect(app, memberCookie);
		const	tabB = await connect(app, memberCookie);

		for (const client of [watcher, tabA, tabB])
			await client.next((m) => m.type === "ready");
		watcher.ws.send(JSON.stringify({ type: "subscribe:board", boardId }));
		await watcher.next((m) => m.type === "presence:state");
		tabA.ws.send(JSON.stringify({ type: "subscribe:board", boardId }));
		await tabA.next((m) => m.type === "presence:state");
		expect(await watcher.next((m) => m.type === "presence:joined")).toMatchObject({ user: { username: "ws-member" } });
		// La segunda pestaña no es un usuario nuevo: el watcher no recibe otro joined
		// y la lista de presencia no repite al usuario.
		tabB.ws.send(JSON.stringify({ type: "subscribe:board", boardId }));
		const	state = await tabB.next((m) => m.type === "presence:state");
		expect(state.users.map((u: any) => u.username).sort()).toEqual(["ws-member", "ws-owner"]);
		// Cerrar una pestaña no es "irse": solo al cerrar la última llega presence:left.
		const	presenceChange = watcher.next((m) => m.type === "presence:joined" || m.type === "presence:left");
		tabA.ws.terminate();
		expect(await Promise.race([presenceChange, new Promise((resolve) => setTimeout(() => resolve("nothing"), 100))])).toBe("nothing");
		tabB.ws.send(JSON.stringify({ type: "unsubscribe:board", boardId }));
		expect(await presenceChange).toMatchObject({ type: "presence:left", user: { username: "ws-member" } });
		tabB.ws.terminate();
		watcher.ws.terminate();
	});

	// Story 5.3: eventos de listas y tarjetas.

	// Conecta al owner, lo suscribe al tablero indicado y devuelve el cliente.
	async	function	subscribedOwner(board = boardId)
	{
		const	client = await connect(app, ownerCookie);

		await client.next((m) => m.type === "ready");
		client.ws.send(JSON.stringify({ type: "subscribe:board", boardId: board }));
		await client.next((m) => m.type === "presence:state");
		return client;
	}

	function	api(method: "POST" | "PATCH" | "DELETE", url: string, payload?: object, cookie = ownerCookie)
	{
		return app.inject({ method, url: `/api/v1${url}`, headers: { cookie }, ...(payload ? { payload } : {}) });
	}

	it("broadcasts list events to the board room", async () => {
		const	client = await subscribedOwner();
		const	created = await api("POST", `/boards/${boardId}/lists`, { name: "Doing" });
		const	listId = created.json().list.id;

		expect(await client.next((m) => m.type === "list:created")).toEqual({ type: "list:created", boardId, list: created.json().list });
		await api("PATCH", `/lists/${listId}`, { name: "In progress" });
		expect(await client.next((m) => m.type === "list:updated")).toMatchObject({ boardId, list: { id: listId, name: "In progress" } });
		await api("DELETE", `/lists/${listId}`);
		expect(await client.next((m) => m.type === "list:deleted")).toEqual({ type: "list:deleted", boardId, listId });
		client.ws.terminate();
	});

	it("broadcasts a list:updated for every list when lists are reordered", async () => {
		const	first = (await api("POST", `/boards/${boardId}/lists`, { name: "First" })).json().list.id;
		const	second = (await api("POST", `/boards/${boardId}/lists`, { name: "Second" })).json().list.id;
		const	client = await subscribedOwner();
		const	active = (await app.inject({ method: "GET", url: `/api/v1/boards/${boardId}/lists?limit=100`, headers: { cookie: ownerCookie } })).json();
		const	listIds = (active.lists ?? active.items).map((list: { id: string }) => list.id).reverse();
		const	reordered = await api("POST", `/boards/${boardId}/lists/reorder`, { listIds });

		expect(reordered.statusCode).toBe(200);
		const	updated = [];
		for (let i = 0; i < listIds.length; i += 1)
			updated.push((await client.next((m) => m.type === "list:updated")).list.id);
		expect(updated.sort()).toEqual([...listIds].sort());
		expect(listIds).toEqual(expect.arrayContaining([first, second]));
		client.ws.terminate();
	});

	it("broadcasts card events to the board room", async () => {
		const	client = await subscribedOwner();
		const	listA = (await api("POST", `/boards/${boardId}/lists`, { name: "A" })).json().list.id;
		const	listB = (await api("POST", `/boards/${boardId}/lists`, { name: "B" })).json().list.id;
		const	created = await api("POST", `/lists/${listA}/cards`, { title: "Live" });
		const	cardId = created.json().card.id;

		expect(await client.next((m) => m.type === "card:created")).toEqual({ type: "card:created", boardId, card: created.json().card });
		await api("PATCH", `/cards/${cardId}`, { title: "Live edit" });
		expect(await client.next((m) => m.type === "card:updated")).toMatchObject({ boardId, card: { id: cardId, title: "Live edit" } });
		await api("POST", `/cards/${cardId}/move`, { targetListId: listB });
		expect(await client.next((m) => m.type === "card:moved")).toMatchObject({ boardId, fromListId: listA, card: { id: cardId, listId: listB } });
		await api("DELETE", `/cards/${cardId}`);
		expect(await client.next((m) => m.type === "card:deleted")).toEqual({ type: "card:deleted", boardId, cardId, listId: listB });
		client.ws.terminate();
	});

	it("removes a card from the source board when it moves to another board", async () => {
		const	otherBoard = (await api("POST", `/organizations/${orgId}/boards`, { name: "Other board" })).json().board.id;
		const	source = (await api("POST", `/boards/${boardId}/lists`, { name: "Source" })).json().list.id;
		const	target = (await api("POST", `/boards/${otherBoard}/lists`, { name: "Target" })).json().list.id;
		const	cardId = (await api("POST", `/lists/${source}/cards`, { title: "Traveller" })).json().card.id;
		const	sourceWatcher = await subscribedOwner(boardId);
		const	targetWatcher = await subscribedOwner(otherBoard);

		await api("POST", `/cards/${cardId}/move`, { targetListId: target });
		expect(await sourceWatcher.next((m) => m.type === "card:deleted")).toEqual({ type: "card:deleted", boardId, cardId, listId: source });
		expect(await targetWatcher.next((m) => m.type === "card:moved")).toMatchObject({ boardId: otherBoard, fromListId: source, card: { id: cardId, listId: target } });
		sourceWatcher.ws.terminate();
		targetWatcher.ws.terminate();
	});

	it("does not publish when the change is rejected", async () => {
		const	client = await subscribedOwner();
		const	listId = (await api("POST", `/boards/${boardId}/lists`, { name: "Guarded" })).json().list.id;

		await client.next((m) => m.type === "list:created");
		const	denied = await api("POST", `/lists/${listId}/cards`, { title: "Intruder" }, strangerCookie);
		expect(denied.statusCode).toBe(404);
		// Un cambio permitido después sirve de marca: si el rechazado hubiera publicado
		// algo, habría llegado antes que este.
		await api("PATCH", `/lists/${listId}`, { name: "Guarded!" });
		expect(await client.next((m) => m.type.startsWith("card:") || m.type.startsWith("list:"))).toMatchObject({ type: "list:updated", list: { name: "Guarded!" } });
		client.ws.terminate();
	});
});
