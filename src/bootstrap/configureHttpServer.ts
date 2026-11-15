import { AppError } from "../shared/errors/AppError.js";
import cookie from "@fastify/cookie";
import type { FastifyInstance } from "fastify";
import { validatorCompiler } from "fastify-type-provider-zod";

export	async	function	configureHttpServer(fastifyInstance: FastifyInstance): Promise<void>
{
	fastifyInstance.setValidatorCompiler(validatorCompiler);
	/* Si un usuario envía una peticion HTTP con el cuerpo completamente vacio 
	en lugar de que Fastify rechace la peticion de inmediato con
	un error generico, lo transforma en un objeto vacio {} para que Zod sea el 
	que decida que error devolver de forma controlada. */
	fastifyInstance.addContentTypeParser("application/json", { parseAs: "string" }, (_request, body, done) => {

		const rawBody = body.toString();
		if (!rawBody.trim()) 
		{
			done(null, {});
			return;
		}
		try 
		{
			done(null, JSON.parse(rawBody));
		}
		catch (_error)
		{
			done(new AppError("Malformed JSON request body", 400, "INVALID_JSON"));
		}
	});
	// Permite que Fastify pueda leer y escribir cookies en las peticiones HTTP
	await fastifyInstance.register(cookie);
}
