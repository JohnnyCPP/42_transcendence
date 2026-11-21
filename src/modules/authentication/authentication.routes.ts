import { clearSessionCookie, setSessionCookie } from "../../shared/http/cookies.js";
import { forbidden } from "../../shared/errors/httpErrors.js";
import {
	registerDocs,
	loginDocs,
	twoFactorLoginDocs,
	logoutDocs,
	reauthenticateDocs,
	changePasswordDocs
} from "./authentication.types.js";
import { requireAuth } from "../authorization/requireAuth.js";
import { securityConfig } from "../../config/security.js";
import { z } from "zod";
import type { AuthenticationService } from "./authentication.service.js";
import type { FastifyInstance } from "fastify";
import type { LoginResult } from "./authentication.types.js";
import type { SessionsService } from "../sessions/sessions.service.js";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

function	getUserAgent(header: string | string[] | undefined): string | null
{
	if (!header)
		return null;
	return Array.isArray(header) ? header.join(", ") : header;
}

function	toPublicLoginResult(result: LoginResult)
{
	if (result.status === "requires_2fa")
	{
		return result;
	}
	return {
		status: result.status,
		user: result.user,
		sessionExpiresAt: result.sessionExpiresAt
	};
}

export	async	function	registerAuthenticationRoutes(fastifyInstance: FastifyInstance,
														  authenticationService: AuthenticationService,
														  sessionsService: SessionsService)
{
	const	typedApp = fastifyInstance.withTypeProvider<ZodTypeProvider>();

	typedApp.post("/api/v1/register", {
				schema: {
					tags: registerDocs.tags,
					summary: registerDocs.summary,
					description: registerDocs.description,
					body: registerDocs.body,
					response: registerDocs.response,
					security: []
				}
	}, async (request, reply) => {

		const	body = request.body;
		const	result = await authenticationService.register({

			...body,
			ipAddress: request.ip,
			userAgent: getUserAgent(request.headers["user-agent"])
		});
		if (result.status === "authenticated")
		{
			setSessionCookie(reply, result.sessionToken, result.sessionExpiresAt);
		}
		return toPublicLoginResult(result);
	});

	typedApp.post("/api/v1/login", { 
				schema: { 
					tags: loginDocs.tags,
					summary: loginDocs.summary,
					description: loginDocs.description,
					body: loginDocs.body,
					response: loginDocs.response,
					security: []
				} 
	}, async (request, reply) => {

		const	body = request.body;
		const	result = await authenticationService.login({

			...body,
			ipAddress: request.ip,
			userAgent: getUserAgent(request.headers["user-agent"])
		});

		if (result.status === "authenticated")
		{
			setSessionCookie(reply, result.sessionToken, result.sessionExpiresAt);
		}
		return toPublicLoginResult(result);
	});

	typedApp.post("/api/v1/two-factor/login", { 
				schema: { 
					tags: twoFactorLoginDocs.tags,
					summary: twoFactorLoginDocs.summary,
					description: twoFactorLoginDocs.description,
					body: twoFactorLoginDocs.body,
					response: twoFactorLoginDocs.response,
					security: []
				} 
	}, async (request, reply) => {

		const	body = request.body;
		const	result = await authenticationService.completeTwoFactorLogin({

			...body,
			ipAddress: request.ip,
			userAgent: getUserAgent(request.headers["user-agent"])
		});

		if (result.status === "authenticated")
		{
			setSessionCookie(reply, result.sessionToken, result.sessionExpiresAt);
		}
		return toPublicLoginResult(result);
	});

	typedApp.post("/api/v1/logout", { 
				schema: { 
					tags: logoutDocs.tags,
					summary: logoutDocs.summary,
					description: logoutDocs.description,
					response: logoutDocs.response,
					security: []
				} 
	}, async (request, reply) => {

		const	token = request.cookies[securityConfig.cookieName];

		if (token)
			await sessionsService.revokeSession(token);
		clearSessionCookie(reply);
		return { ok: true } as const;
	});

	typedApp.post("/api/v1/reauthenticate", {

		preHandler: requireAuth(sessionsService),
		schema: { 
			tags: reauthenticateDocs.tags,
			summary: reauthenticateDocs.summary,
			description: reauthenticateDocs.description,
			body: reauthenticateDocs.body,
			response: reauthenticateDocs.response,
			security: []
		} 
	}, async (request) => {

		const	body = request.body;

		await authenticationService.reauthenticate({

			userId: request.currentUser!.id,
			password: body.password,
			sessionId: request.currentSession!.id,
			secondFactorCode: body.secondFactorCode,
			secondFactorMethod: body.secondFactorMethod
		});
		return { ok: true } as const;
	});

	typedApp.post("/api/v1/change-password", {

		preHandler: requireAuth(sessionsService),
		schema: { 
			tags: changePasswordDocs.tags,
			summary: changePasswordDocs.summary,
			description: changePasswordDocs.description,
			body: changePasswordDocs.body,
			response: changePasswordDocs.response,
			security: []
		} 
	}, async (request) => {

		const	body = request.body;
		const	reauthenticatedAt = request.currentSession!.reauthenticatedAt;

		if (!reauthenticatedAt || Date.now() - reauthenticatedAt.getTime() > securityConfig.sensitiveActionTtlMs)
		{
			throw forbidden("Recent reauthentication required", "REAUTHENTICATION_REQUIRED");
		}
		await authenticationService.changePassword(request.currentUser!.id, body.newPassword);
		await sessionsService.revokeOtherUserSessions(request.currentUser!.id, request.currentSession!.id);
		return { ok: true } as const;
	});
}
