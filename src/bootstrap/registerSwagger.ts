import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";
import {
	jsonSchemaTransform,
	jsonSchemaTransformObject
} from "fastify-type-provider-zod";
import type { FastifyInstance } from "fastify";

export	async	function	registerSwagger(fastifyInstance: FastifyInstance): Promise<void>
{
	await fastifyInstance.register(fastifySwagger, {
		openapi: {
			info: {
				title: "TaskFlow Public API",
				description: "Programmatic access to TaskFlow boards and cards. Authenticate with an API key created from your account settings.",
				version: "v1"
			},
			servers: [{ url: "/" }],
			components: {
				securitySchemes: {
					ApiKeyAuth: {
						type: "apiKey",
						in: "header",
						name: "X-API-Key",
						description: "API key created via POST /api-keys. Prefix: tfk_"
					}
				}
			},
			security: [{ ApiKeyAuth: [] }]
		},
		transform: jsonSchemaTransform,
		transformObject: jsonSchemaTransformObject
	});
	await fastifyInstance.register(fastifySwaggerUI, {
		routePrefix: "/api/docs",
		uiConfig: {
			docExpansion: "list",
			deepLinking: true
		}
	});
}
