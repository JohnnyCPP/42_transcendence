import { createRepositories } from "./bootstrap/createRepositories.js";
import { createPrismaClient } from "./db/createPrismaClient.js";
import { createServices } from "./bootstrap/createServices.js";
import { configureHttpServer } from "./bootstrap/configureHttpServer.js";
import { env } from "./config/env.js";
import Fastify from "fastify";
import { registerAppRoutes } from "./bootstrap/registerAppRoutes.js";
import { registerErrorHandlers } from "./bootstrap/registerErrorHandlers.js";
import { registerHealthCheck } from "./bootstrap/registerHealthCheck.js";
import { registerSwagger } from "./bootstrap/registerSwagger.js";
import { registerTestDecorators } from "./bootstrap/registerTestDecorators.js";
import { registerWebSocket } from "./ws/registerWebSocket.js";
import { requireApiKey } from "./modules/authorization/requireApiKey.js";
import type { PrismaClient } from "@prisma/client";

export async function buildApp() 
{
	const	envToLogger = {
		development: {

			level: "debug",
			transport: {

			  target: "pino-pretty",
			  options: { 
				  translateTime: "HH:MM:ss Z", 
				  ignore: "pid,hostname" 
			  }
			}
		},
		production: {
			level: "info"
		},
		test: false
	};
	const	fastifyInstance = Fastify({ logger: envToLogger[env.NODE_ENV] ?? true });
	const	prismaClient: PrismaClient | null = createPrismaClient();

	await configureHttpServer(fastifyInstance);
	if (prismaClient) 
	{
		fastifyInstance.addHook("onClose", async () => { await prismaClient.$disconnect(); });
	}
	const repositories = createRepositories(prismaClient);
	// Reconcile expired challenges at startup and periodically, including those never retried.
	await repositories.authenticationRepository.expireLoginChallenges(new Date());
	const expiryTimer = setInterval(() => {
		void repositories.authenticationRepository.expireLoginChallenges(new Date()).catch((error: unknown) => {
			fastifyInstance.log.error(error, 'Failed to expire login challenges');
		});
	}, 60_000);
	expiryTimer.unref();
	fastifyInstance.addHook('onClose', async () => { clearInterval(expiryTimer); });
	const services = createServices(repositories);
	registerTestDecorators(fastifyInstance, services, repositories);
	registerErrorHandlers(fastifyInstance);
	registerHealthCheck(fastifyInstance, prismaClient);
	await registerSwagger(fastifyInstance);
	await registerWebSocket(fastifyInstance, services);
	await registerAppRoutes(fastifyInstance, services);
	// uncomment this to print routes on the terminal
	//
	// await fastifyInstance.ready();
	// console.log(fastifyInstance.printRoutes());
	return fastifyInstance;
}
