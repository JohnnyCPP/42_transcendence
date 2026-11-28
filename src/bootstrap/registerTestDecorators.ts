import { env } from "../config/env.js";
import "./testContext.types.js";
import type { FastifyInstance } from "fastify";
import type { Repositories } from "./createRepositories.js";
import type { Services } from "./createServices.js";
import type { UsersRepository } from "../modules/users/users.repository.js";
import type { BoardRooms } from "../ws/boardRooms.js";

export	function	registerTestDecorators(fastifyInstance: FastifyInstance, 
										   services: Services, 
										   repositories: Repositories,
										   boardRooms: BoardRooms): void
{
	if (env.NODE_ENV !== "test") 
		return;
	fastifyInstance.decorate("testContext", {

		...services,
		authenticationRepository: repositories.authenticationRepository,
		usersRepository: repositories.usersRepository,
		boardRooms
	});
}
