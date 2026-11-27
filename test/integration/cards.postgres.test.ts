// Story 5.3: concurrent card moves against real PostgreSQL, and their real-time events.
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// The runner sets NODE_ENV=development to use the real Prisma repositories.
if (!process.env.DATABASE_URL?.match(/^postgresql:\/\/local_cards:local_cards_only@127\.0\.0\.1:\d+\/local_cards$/))
	throw new Error("Run this test only through npm run test:cards:integration");
const { buildApp } = await import("../../src/app.js");

type App = Awaited<ReturnType<typeof buildApp>>;

const	CARDS = 10;

describe("card positions under concurrency with PostgreSQL", () => {
	let	app: App;
	let	cookie: string;
	let	boardId: string;
	let	listA: string;
	let	listB: string;

	const	call = (method: "GET" | "POST", url: string, payload?: object) =>
		app.inject({ method, url: `/api/v1${url}`, headers: { cookie }, ...(payload ? { payload } : {}) });
	const	positionsOf = async (listId: string): Promise<number[]> =>
		(await call("GET", `/lists/${listId}/cards?limit=100`)).json().cards.map((card: { position: number }) => card.position);

	beforeAll(async () => {
		app = await buildApp();
		await app.ready();
		const	registered = await app.inject({ method: "POST", url: "/api/v1/register", payload: { username: "cards-owner", password: "local test password 123" } });
		expect(registered.statusCode, registered.body).toBe(200);
		cookie = registered.headers["set-cookie"]!.toString().split(";")[0];
		const	org = await call("POST", "/organizations", { name: "Cards org" });
		expect(org.statusCode, org.body).toBe(201);
		boardId = (await call("POST", `/organizations/${org.json().organization.id}/boards`, { name: "Board" })).json().board.id;
		listA = (await call("POST", `/boards/${boardId}/lists`, { name: "A" })).json().list.id;
		listB = (await call("POST", `/boards/${boardId}/lists`, { name: "B" })).json().list.id;
	});

	afterAll(async () => { await app.close(); });

	it("creates and moves cards concurrently without duplicate positions, publishing one event per move", async () => {
		const	created = await Promise.all(Array.from({ length: CARDS }, (_, i) => call("POST", `/lists/${listA}/cards`, { title: `Card ${i}` })));

		expect(created.map((response) => response.statusCode)).toEqual(Array(CARDS).fill(200));
		expect(new Set(await positionsOf(listA)).size).toBe(CARDS);

		// Un cliente suscrito al tablero recoge los eventos de los movimientos.
		const	moved: Array<{ fromListId: string; card: { id: string; listId: string } }> = [];
		let		subscribed!: () => void;
		const	ready = new Promise<void>((resolve) => { subscribed = resolve; });
		// El listener va en onInit para no perder el "ready" que llega nada más conectar.
		const	ws = await app.injectWS("/ws", { headers: { cookie } }, {
			onInit(socket)
			{
				socket.on("message", (raw) => {
					const	message = JSON.parse(raw.toString());

					if (message.type === "ready")
						socket.send(JSON.stringify({ type: "subscribe:board", boardId }));
					if (message.type === "presence:state")
						subscribed();
					if (message.type === "card:moved")
						moved.push(message);
				});
			}
		});
		await ready;

		// Todas las tarjetas a la misma lista a la vez: cada movimiento calcula su
		// posición como "la última + 1000", así que sin bloqueo chocarían.
		const	moves = await Promise.all(created.map((response) =>
			call("POST", `/cards/${response.json().card.id}/move`, { targetListId: listB })));

		expect(moves.map((response) => response.statusCode)).toEqual(Array(CARDS).fill(200));
		const	positions = await positionsOf(listB);
		expect(positions).toHaveLength(CARDS);
		expect(new Set(positions).size).toBe(CARDS);
		expect(await positionsOf(listA)).toEqual([]);

		await expect.poll(() => moved.length).toBe(CARDS);
		expect(moved.every((event) => event.fromListId === listA && event.card.listId === listB)).toBe(true);
		ws.terminate();
	});
});
