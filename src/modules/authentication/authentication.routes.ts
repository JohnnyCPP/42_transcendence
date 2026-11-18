import { clearSessionCookie, setSessionCookie } from "../../shared/http/cookies.js";
import { forbidden } from "../../shared/errors/httpErrors.js";
import { requireAuth } from "../authorization/requireAuth.js";
import { securityConfig } from "../../config/security.js";
import { z } from "zod";
import type { AuthenticationService } from "./authentication.service.js";
import type { FastifyInstance } from "fastify";
import type { LoginResult } from "./authentication.types.js";
import type { SessionsService } from "../sessions/sessions.service.js";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

const	registerSchema = z.object({

	username: z.string().min(3).max(32),
	email: z.string().email().max(254).optional(),
	password: z.string().min(12).max(128)
});

const	loginSchema = z.object({

	username: z.string().min(3).max(32),
	password: z.string().min(1).max(128)
});

const	twoFactorLoginSchema = z.discriminatedUnion("method", [

	z.object({
		challengeToken: z.string().length(43),
		code: z.string().regex(/^\d{6}$/),
		method: z.literal("totp")
	}),

	z.object({
		challengeToken: z.string().length(43),
		code: z.string().trim().regex(/^[A-Za-z0-9_-]{12}$/),
		method: z.literal("recovery_code")
	})
]);

const	reauthenticateSchema = z.object({

	password: z.string().min(1).max(128),
	secondFactorCode: z.string().min(1).max(64).optional(),
	secondFactorMethod: z.enum(["totp", "recovery_code"]).optional()
});

const	changePasswordSchema = z.object({ newPassword: z.string().min(12).max(128) });

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

	typedApp.post("/api/v1/register", { schema: { body: registerSchema } }, async (request, reply) => {

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

	typedApp.post("/api/v1/login", { schema: { body: loginSchema } }, async (request, reply) => {

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

	typedApp.post("/api/v1/two-factor/login", { schema: { body: twoFactorLoginSchema } }, async (request, reply) => {

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

	typedApp.post("/api/v1/logout", async (request, reply) => {

		const	token = request.cookies[securityConfig.cookieName];

		if (token)
			await sessionsService.revokeSession(token);
		clearSessionCookie(reply);
		return { ok: true };
	});

	typedApp.post("/api/v1/reauthenticate", {

		preHandler: requireAuth(sessionsService),
		schema: { body: reauthenticateSchema }
	}, async (request) => {

		const	body = request.body;

		await authenticationService.reauthenticate({

			userId: request.currentUser!.id,
			password: body.password,
			sessionId: request.currentSession!.id,
			secondFactorCode: body.secondFactorCode,
			secondFactorMethod: body.secondFactorMethod
		});
		return { ok: true };
	});

	typedApp.post("/api/v1/change-password", {

		preHandler: requireAuth(sessionsService),
		schema: { body: changePasswordSchema }
	}, async (request) => {

		const	body = request.body;
		const	reauthenticatedAt = request.currentSession!.reauthenticatedAt;

		if (!reauthenticatedAt || Date.now() - reauthenticatedAt.getTime() > securityConfig.sensitiveActionTtlMs)
		{
			throw forbidden("Recent reauthentication required", "REAUTHENTICATION_REQUIRED");
		}
		await authenticationService.changePassword(request.currentUser!.id, body.newPassword);
		await sessionsService.revokeOtherUserSessions(request.currentUser!.id, request.currentSession!.id);
		return { ok: true };
	});
}
