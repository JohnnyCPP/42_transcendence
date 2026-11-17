import { rateLimitKey } from "../../shared/http/rateLimit.js";
import { requireApiKey } from "../authorization/requireApiKey.js";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { PublicApiDependencies } from "./publicApi.types.js";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

/*
 * "dependencies.rateLimiter.consume(apiKey)" checks if the apiKey passed 
 * to it exceeds the amount of requests per unit of time
 *
 * if it's exceeded, throws tooManyRequests()
 *
 * because "rateLimit" runs as a preHandler, every call to any route 
 * defined here is guaranteed to be an authenticated API Key request
 */
export	async	function	registerPublicApiRoutes(fastifyInstance: FastifyInstance,
													dependencies: PublicApiDependencies): Promise<void>
{
	let	typedApp;
	let	rateLimit;
	let	guards;

	typedApp = fastifyInstance.withTypeProvider<ZodTypeProvider>();
	rateLimit = async (request: FastifyRequest, _reply: FastifyReply) => {

		dependencies.rateLimiter.consume(rateLimitKey("public-api-key", request.currentApiKey!.id));
	};
	guards = [
		requireApiKey(dependencies.apiKeysService, dependencies.usersService),
		rateLimit
	];
	// TODO: implement pulic api endpoints
	/*
	typedApp.get("/api/v1/boards", { preHandler: guards }, async (request) => {

		return dependencies.boardsService.listForUser(request.currentUser!.id);
	});
	*/
}
