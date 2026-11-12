import type { FastifyInstance } from "fastify";
import { registerAuthRoutes } from "../modules/auth/auth.routes.js";
import { registerBoardRoutes } from "../modules/boards/boards.routes.js";
import { registerCardRoutes } from "../modules/cards/cards.routes.js";
import { registerListRoutes } from "../modules/lists/lists.routes.js";
import { registerOrganizationRoutes } from "../modules/organizations/organizations.routes.js";
import { registerTwoFactorRoutes } from "../modules/two_factor/twoFactor.routes.js";
import { registerUiRoutes } from "../ui/ui.routes.js";
import { registerUserRoutes } from "../modules/users/users.routes.js";
import type { Services } from "./createServices.js";

export	async	function	registerAppRoutes(fastifyInstance: FastifyInstance,
									  		  services: Services): Promise<void>
{
	await registerAuthRoutes(fastifyInstance, services.authService, services.sessionsService);
	await registerBoardRoutes(fastifyInstance, services.boardsService, services.sessionsService);
	await registerCardRoutes(fastifyInstance, services.cardsService, services.sessionsService);
	await registerListRoutes(fastifyInstance, services.listsService, services.sessionsService);
	await registerOrganizationRoutes(fastifyInstance, services.organizationsService, services.sessionsService);
	await registerTwoFactorRoutes(fastifyInstance, services.twoFactorService, services.sessionsService);
	await registerUiRoutes(fastifyInstance);
	await registerUserRoutes(fastifyInstance, services.sessionsService, services.usersService);
}
