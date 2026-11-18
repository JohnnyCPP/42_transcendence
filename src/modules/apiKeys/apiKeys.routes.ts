import { requireAuth } from "../authorization/requireAuth.js";
import { z } from "zod";
import type { ApiKeysService } from "./apiKeys.service.js";
import type { FastifyInstance } from "fastify";
import type { SessionsService } from "../sessions/sessions.service.js";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

const	createSchema = z.object({
	name: z.string().trim().min(1).max(64)
});

const	keyIdParamSchema = z.object({
	id: z.string().uuid()
});

export	async	function	registerApiKeyRoutes(fastifyInstance: FastifyInstance,
												 apiKeysService: ApiKeysService,
												 sessionsService: SessionsService): Promise<void>
{
	const	typedApp = fastifyInstance.withTypeProvider<ZodTypeProvider>();
	const	authorization = { preHandler: requireAuth(sessionsService) };

	typedApp.post("/api/v1/api-keys", { ...authorization, schema: { body: createSchema } }, async (request, reply) => {

		const	body = request.body;
		const	result = await apiKeysService.create(request.currentUser!.id, body.name);

		return reply.status(201).send(result);
	});

	typedApp.get("/api/v1/api-keys", authorization, async (request) => {

		return apiKeysService.list(request.currentUser!.id);
	});

	typedApp.delete("/api/v1/api-keys/:id", { ...authorization, schema: { params: keyIdParamSchema } }, async (request) => {

		const	params = request.params;

		return apiKeysService.revoke(request.currentUser!.id, params.id);
	});
}
