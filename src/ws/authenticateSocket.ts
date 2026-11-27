/**
 * Hook preValidation de /ws: valida la cookie de sesión y guarda el
 * resultado en request.wsAuth. Nunca lanza, para que el upgrade ocurra
 * siempre y el handler pueda cerrar con 4401 en vez de responder HTTP 401.
 */
import { securityConfig } from "../config/security.js";
import type { FastifyRequest } from "fastify";
import type { SessionsService } from "../modules/sessions/sessions.service.js";
import "./types.js";

export	function	authenticateSocket(sessionsService: SessionsService)
{
	return async (request: FastifyRequest): Promise<void> => {
		const	token = request.cookies[securityConfig.cookieName];
		let		sessionWithUser;

		request.wsAuth = null;
		if (!token)
			return;
		sessionWithUser = await sessionsService.getSessionFromToken(token);
		if (!sessionWithUser)
			return;
		request.wsAuth = { user: sessionWithUser.user, sessionId: sessionWithUser.session.id };
	};
}
