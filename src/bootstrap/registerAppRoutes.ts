import { env } from "../config/env.js";
import { InMemoryRateLimiter } from "../shared/http/rateLimit.js";
import { registerApiKeyRoutes } from "../modules/apiKeys/apiKeys.routes.js";
import { registerAuthenticationRoutes } from "../modules/authentication/authentication.routes.js";
import { registerBoardRoutes } from "../modules/boards/boards.routes.js";
import { registerCardRoutes } from "../modules/cards/cards.routes.js";
import { registerCommentRoutes } from "../modules/comments/comments.routes.js";
import { registerListRoutes } from "../modules/lists/lists.routes.js";
import { registerOrganizationRoutes } from "../modules/organizations/organizations.routes.js";
import { registerPublicApiRoutes } from "../modules/publicApi/publicApi.routes.js";
import { registerTwoFactorRoutes } from "../modules/twoFactor/twoFactor.routes.js";
import { registerUserRoutes } from "../modules/users/users.routes.js";
import type { FastifyInstance } from "fastify";
import type { Services } from "./createServices.js";

export	async	function	registerAppRoutes(fastifyInstance: FastifyInstance,
									  		  services: Services): Promise<void>
{
	let	rateLimiter;

	await registerApiKeyRoutes(fastifyInstance, services.apiKeysService, services.sessionsService);
	await registerAuthenticationRoutes(fastifyInstance, services.authenticationService, services.sessionsService);
	await registerBoardRoutes(fastifyInstance, services.boardsService, services.sessionsService);
	await registerCardRoutes(fastifyInstance, services.cardsService, services.sessionsService);
	await registerCommentRoutes(fastifyInstance, services.commentsService, services.sessionsService);
	await registerListRoutes(fastifyInstance, services.listsService, services.sessionsService);
	await registerOrganizationRoutes(fastifyInstance, services.organizationsService, services.sessionsService);
	await registerTwoFactorRoutes(fastifyInstance, services.twoFactorService, services.sessionsService);
	await registerUserRoutes(fastifyInstance, services.sessionsService, services.usersService);
	rateLimiter = new InMemoryRateLimiter(env.PUBLIC_API_RATE_LIMIT_RPM, env.PUBLIC_API_RATE_LIMIT_WINDOW_MS);
	await registerPublicApiRoutes(fastifyInstance, {

		apiKeysService: services.apiKeysService,
		usersService: services.usersService,
		boardsService: services.boardsService,
		cardsService: services.cardsService,
		listsService: services.listsService,
		publicApiService: services.publicApiService,
		rateLimiter
	});
}
