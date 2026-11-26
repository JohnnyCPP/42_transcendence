/**
 * Registra el plugin @fastify/websocket y expone la ruta /ws.
 * De momento es un endpoint de eco temporal para comprobar que el proxy
 * WebSocket del servidor HTTPS de Next.js (frontend/server.mjs) funciona.
 * La Épica 5 lo sustituirá por la conexión real en tiempo real.
 */
import websocket from "@fastify/websocket";
import type { FastifyInstance } from "fastify";

export	async	function	registerWebSocket(fastifyInstance: FastifyInstance): Promise<void>
{
	await fastifyInstance.register(websocket);
	fastifyInstance.get("/ws", { websocket: true }, (socket, request) => {
		request.log.info({ hasCookie: Boolean(request.headers.cookie) }, "ws echo connected");
		socket.on("message", (message) => {
			socket.send(message.toString());
		});
	});
}
