/**
 * Tipos compartidos de la capa WebSocket.
 */
import { z } from "zod";
import type { WebSocket } from "@fastify/websocket";
import type { User } from "../modules/users/users.types.js";

export	type	PublicProfile = Pick<User, "id" | "username" | "displayName">;

export	type	WsAuth = {
	user: User;
	sessionId: string;
};

export	type	AuthenticatedSocket = WebSocket & {
	user: User;
	sessionId: string;
	lastPongAt: number;
};

declare module "fastify"
{
	interface FastifyRequest
	{
		wsAuth?: WsAuth | null;
	}
}

export	const	clientMessageSchema = z.discriminatedUnion("type", [
	z.object({ type: z.literal("subscribe:board"), boardId: z.string().min(1) }),
	z.object({ type: z.literal("unsubscribe:board"), boardId: z.string().min(1) })
]);

export	type	ClientMessage = z.infer<typeof clientMessageSchema>;

export	function	toPublicProfile(user: User): PublicProfile
{
	return { id: user.id, username: user.username, displayName: user.displayName };
}
