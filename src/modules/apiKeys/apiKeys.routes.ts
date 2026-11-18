import {
	createApiKeyDocs,
	listApiKeysDocs,
	revokeApiKeyDocs
} from "./apiKeys.types.js";
import { requireAuth } from "../authorization/requireAuth.js";
import { z } from "zod";
import type { ApiKeysService } from "./apiKeys.service.js";
import type { FastifyInstance } from "fastify";
import type { SessionsService } from "../sessions/sessions.service.js";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

export	async	function	registerApiKeyRoutes(fastifyInstance: FastifyInstance,
												 apiKeysService: ApiKeysService,
												 sessionsService: SessionsService): Promise<void>
{
	const	typedApp = fastifyInstance.withTypeProvider<ZodTypeProvider>();
	const	authorization = { preHandler: requireAuth(sessionsService) };

	typedApp.post("/api/v1/api-keys", {
				...authorization,
				schema: {
					tags: createApiKeyDocs.tags,
					summary: createApiKeyDocs.summary,
					description: createApiKeyDocs.description,
					body: createApiKeyDocs.body,
					response: createApiKeyDocs.response,
					security: []
				}
	}, async (request, reply) => {

		const	body = request.body;
		const	result = await apiKeysService.create(request.currentUser!.id, body.name);

		return reply.status(201).send(result);
	});

	typedApp.get("/api/v1/api-keys", {
				...authorization,
				schema: {
					tags: listApiKeysDocs.tags,
					summary: listApiKeysDocs.summary,
					description: listApiKeysDocs.description,
					response: listApiKeysDocs.response,
					security: []
				}
	}, async (request) => {

		return apiKeysService.list(request.currentUser!.id);
	});

	typedApp.delete("/api/v1/api-keys/:id", {
					...authorization,
					schema: {
						tags: revokeApiKeyDocs.tags,
						summary: revokeApiKeyDocs.summary,
						description: revokeApiKeyDocs.description,
						params: revokeApiKeyDocs.params,
						response: revokeApiKeyDocs.response,
						security: []
					}
	}, async (request) => {

		const	params = request.params;

		return apiKeysService.revoke(request.currentUser!.id, params.id);
	});
}
