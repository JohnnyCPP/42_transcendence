import { env } from "../config/env.js";
import type { FastifyInstance } from "fastify";
import type { Repositories } from "./createRepositories.js";
import type { Services } from "./createServices.js";
import "./testContext.types.js";

export	function	registerTestDecorators(fastifyInstance: FastifyInstance, 
										   services: Services, 
										   repositories: Repositories): void
{
	if (env.NODE_ENV !== "test") 
		return;
	fastifyInstance.decorate("testContext", {

		...services,
		authRepository: repositories.authRepository
	});
}
