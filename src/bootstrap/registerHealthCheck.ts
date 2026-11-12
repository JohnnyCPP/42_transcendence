import type { FastifyInstance } from "fastify";
import type { PrismaClient } from "@prisma/client";

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
