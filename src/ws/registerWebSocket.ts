/**
 * Capa WebSocket en tiempo real (Épica 5).
 *
 * GET /ws solo acepta conexiones con una cookie de sesión válida: las
 * demás se cierran con el código 4401. Sustituye al eco de la Story 1.6.
 */
import websocket from "@fastify/websocket";
import { authenticateSocket } from "./authenticateSocket.js";
import { toPublicProfile } from "./types.js";
import type { AuthenticatedSocket } from "./types.js";
import type { FastifyInstance } from "fastify";
import type { Services } from "../bootstrap/createServices.js";

export	async	function	registerWebSocket(fastifyInstance: FastifyInstance,
											  services: Services): Promise<void>
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
			sessionId: request.wsAuth.sessionId
		});
		client.send(JSON.stringify({ type: "ready", user: toPublicProfile(client.user) }));
	});
}
