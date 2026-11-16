import { env } from "../config/env.js";
import "./testContext.types.js";
import type { FastifyInstance } from "fastify";
import type { Repositories } from "./createRepositories.js";
import type { Services } from "./createServices.js";

export	function	registerTestDecorators(fastifyInstance: FastifyInstance, 
										   services: Services, 
										   repositories: Repositories): void
{
	if (env.NODE_ENV !== "test") 
		return;
	fastifyInstance.decorate("testContext", {

		...services,
		authenticationRepository: repositories.authenticationRepository
	});
}
