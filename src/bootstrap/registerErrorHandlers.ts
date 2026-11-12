import { AppError } from "../shared/errors/AppError.js";
import type { FastifyInstance } from "fastify";
import { hasZodFastifySchemaValidationErrors } from "fastify-type-provider-zod";

export	function	registerErrorHandlers(fastifyInstance: FastifyInstance): void
{
	fastifyInstance.setErrorHandler((error, _request, reply) => {

		if (error instanceof AppError)
		{
			return reply.status(error.statusCode).send({

				error: error.code, 
				message: error.message 
			});
		}
		if (hasZodFastifySchemaValidationErrors(error))
		{
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
