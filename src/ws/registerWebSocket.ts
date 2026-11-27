/**
 * Capa WebSocket en tiempo real (Épica 5).
 *
 * GET /ws solo acepta conexiones con una cookie de sesión válida: las
 * demás se cierran con el código 4401. Una vez dentro, el cliente puede
 * suscribirse a los tableros de los que es miembro y recibe la presencia
 * de quién más los está viendo.
 */
import websocket from "@fastify/websocket";
import { authenticateSocket } from "./authenticateSocket.js";
import { clientMessageSchema, toPublicProfile } from "./types.js";
import type { AuthenticatedSocket } from "./types.js";
import type { BoardRooms } from "./boardRooms.js";
import type { FastifyInstance } from "fastify";
import type { Services } from "../bootstrap/createServices.js";

export	async	function	registerWebSocket(fastifyInstance: FastifyInstance,
											  services: Services,
											  boardRooms: BoardRooms): Promise<void>
{
	await fastifyInstance.register(websocket);
	fastifyInstance.get("/ws", {
		websocket: true,
		preValidation: authenticateSocket(services.sessionsService)
	}, (socket, request) => {
		if (!request.wsAuth)
		{
			socket.close(4401, "Unauthorized");
			return;
		}
		const	client: AuthenticatedSocket = Object.assign(socket, {
			user: request.wsAuth.user,
			sessionId: request.wsAuth.sessionId,
			lastPongAt: Date.now()
		});
		boardRooms.add(client);
		client.on("pong", () => { client.lastPongAt = Date.now(); });
		client.on("close", () => boardRooms.remove(client));
		client.on("message", (raw) => { void handleMessage(client, raw.toString()); });
		client.send(JSON.stringify({ type: "ready", user: toPublicProfile(client.user) }));
	});

	async	function	handleMessage(client: AuthenticatedSocket, raw: string): Promise<void>
	{
		let	json: unknown;
		let	parsed;

		try
		{
			json = JSON.parse(raw);
		}
		catch
		{
			return sendError(client, "INVALID_JSON", "Message is not valid JSON");
		}
		parsed = clientMessageSchema.safeParse(json);
		if (!parsed.success)
			return sendError(client, "INVALID_MESSAGE", "Unknown or malformed message");
		if (parsed.data.type === "unsubscribe:board")
			return boardRooms.leave(parsed.data.boardId, client);
		try
		{
			await services.boardsService.getByBoardIdAndUserId(parsed.data.boardId, client.user.id, "read");
		}
		catch
		{
			return sendError(client, "BOARD_FORBIDDEN", "You are not a member of this board", parsed.data.boardId);
		}
		if (client.readyState === client.OPEN)
			boardRooms.join(parsed.data.boardId, client);
	}
}

function	sendError(client: AuthenticatedSocket, code: string, message: string, boardId?: string): void
{
	client.send(JSON.stringify({ type: "error", code, message, boardId }));
}
