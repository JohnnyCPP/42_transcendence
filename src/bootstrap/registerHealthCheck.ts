import type { FastifyInstance } from "fastify";
import type { PrismaClient } from "@prisma/client";

/*
 * Docker Compose healthcheck hits this endpoint directly at 
 * "http://localhost/health" from inside the container 
 *
 * It doesn't need to be reachable from the client browser, 
 * so nextjs does not redirect it
 */
export	function	registerHealthCheck(fastifyInstance: FastifyInstance, 
										prismaClient: PrismaClient | null): void
{
	fastifyInstance.get("/health", async (_request, reply) => {

		try 
		{
			if (!prismaClient) 
			{
				throw new Error("Database is not configured");
			}
			await prismaClient.$queryRaw`SELECT 1`;
			return { ok: true };
		} 
		catch 
		{
			fastifyInstance.log.warn("Health check failed: database unavailable");
			return reply.status(503).send({ ok: false });
		}
	});
}
