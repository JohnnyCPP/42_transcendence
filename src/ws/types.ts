/**
 * Tipos compartidos de la capa WebSocket.
 */
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
};

declare module "fastify"
{
	interface FastifyRequest
	{
		wsAuth?: WsAuth | null;
	}
}

export	function	toPublicProfile(user: User): PublicProfile
{
	return { id: user.id, username: user.username, displayName: user.displayName };
}
