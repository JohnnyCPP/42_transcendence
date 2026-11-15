import { createRepositories } from "./bootstrap/createRepositories.js";
import { createPrismaClient } from "./db/createPrismaClient.js";
import { createServices } from "./bootstrap/createServices.js";
import { configureHttpServer } from "./bootstrap/configureHttpServer.js";
import { env } from "./config/env.js";
import Fastify from "fastify";
import { registerAppRoutes } from "./bootstrap/registerAppRoutes.js";
import { registerErrorHandlers } from "./bootstrap/registerErrorHandlers.js";
import { registerHealthCheck } from "./bootstrap/registerHealthCheck.js";
import { registerTestDecorators } from "./bootstrap/registerTestDecorators.js";
import type { PrismaClient } from "@prisma/client";

export async function buildApp() 
{
	const	fastifyInstance = Fastify({ logger: env.NODE_ENV !== "test" });
	const	prismaClient: PrismaClient | null = createPrismaClient();

	await configureHttpServer(fastifyInstance);
	if (prismaClient) 
	{
		fastifyInstance.addHook("onClose", async () => { await prismaClient.$disconnect(); });
	}
	const repositories = createRepositories(prismaClient);
	const services = createServices(repositories);
	registerTestDecorators(fastifyInstance, services, repositories);
	registerErrorHandlers(fastifyInstance);
	registerHealthCheck(fastifyInstance, prismaClient);
	await registerAppRoutes(fastifyInstance, services);
	return fastifyInstance;
}
