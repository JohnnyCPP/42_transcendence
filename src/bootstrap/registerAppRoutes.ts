import { registerApiKeyRoutes } from "../modules/apiKeys/apiKeys.routes.js";
import { registerAuthenticationRoutes } from "../modules/authentications/authentications.routes.js";
import { registerBoardRoutes } from "../modules/boards/boards.routes.js";
import { registerCardRoutes } from "../modules/cards/cards.routes.js";
import { registerCommentRoutes } from "../modules/comments/comments.routes.js";
import { registerListRoutes } from "../modules/lists/lists.routes.js";
import { registerOrganizationRoutes } from "../modules/organizations/organizations.routes.js";
import { registerTwoFactorRoutes } from "../modules/two_factor/twoFactor.routes.js";
import { registerUiRoutes } from "../ui/ui.routes.js";
import { registerUserRoutes } from "../modules/users/users.routes.js";
import type { FastifyInstance } from "fastify";
import type { Services } from "./createServices.js";

export	async	function	registerAppRoutes(fastifyInstance: FastifyInstance,
									  		  services: Services): Promise<void>
{
	await registerApiKeyRoutes(fastifyInstance, services.apiKeysService, services.sessionsService);
	await registerAuthenticationRoutes(fastifyInstance, services.authenticationsService, services.sessionsService);
	await registerBoardRoutes(fastifyInstance, services.boardsService, services.sessionsService, services.organizationsService);
	await registerCardRoutes(fastifyInstance, services.cardsService, services.sessionsService);
	await registerCommentRoutes(fastifyInstance, services.commentsService, services.sessionsService);
	await registerListRoutes(fastifyInstance, services.listsService, services.sessionsService);
	await registerOrganizationRoutes(fastifyInstance, services.organizationsService, services.sessionsService);
	await registerTwoFactorRoutes(fastifyInstance, services.twoFactorService, services.sessionsService, services.authenticationsService);
	await registerUiRoutes(fastifyInstance);
	await registerUserRoutes(fastifyInstance, services.sessionsService, services.usersService);
}
