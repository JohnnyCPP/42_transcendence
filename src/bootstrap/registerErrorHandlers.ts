import { AppError } from "../shared/errors/AppError.js";
import { hasZodFastifySchemaValidationErrors } from "fastify-type-provider-zod";
import type { FastifyInstance } from "fastify";

export	function	registerErrorHandlers(fastifyInstance: FastifyInstance): void
{
	fastifyInstance.setErrorHandler((error, request, reply) => {

		if (error instanceof AppError)
		{
			const route = request.routeOptions.url;
			if (error.statusCode === 429 ||
				((route === '/auth/login' || route === '/auth/login/2fa') && error.statusCode === 401) ||
				((route === '/auth/2fa/verify-setup' || route === '/2fa/confirm') && [400, 401].includes(error.statusCode)))
				request.log.warn({ event: 'authentication_attempt_failed', route, statusCode: error.statusCode, errorCode: error.code }, 'Authentication attempt failed');
			if (error.statusCode === 429 && error.retryAfterSeconds !== undefined)
				reply.header('Retry-After', String(error.retryAfterSeconds));
			return reply.status(error.statusCode).send({

				error: error.code, 
				message: error.message 
			});
		}
		if (hasZodFastifySchemaValidationErrors(error))
		{
			if (['/auth/login', '/auth/login/2fa', '/auth/2fa/verify-setup', '/2fa/confirm'].includes(request.routeOptions.url ?? ''))
				request.log.warn({ event: 'authentication_attempt_failed', route: request.routeOptions.url, statusCode: 400, errorCode: 'VALIDATION_ERROR' }, 'Authentication attempt failed');
			return reply.status(400).send({

				error: "VALIDATION_ERROR", 
				message: "Invalid request body"
			});
		}
		fastifyInstance.log.error(error);
		return reply.status(500).send({

			error: "INTERNAL_ERROR",
			message: "Internal server error"
		});
	});
}
