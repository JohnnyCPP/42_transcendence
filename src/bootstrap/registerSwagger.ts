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
				title: "TaskFlow Server",
				description: "Comprehensive list of documented session and public endpoints of TaskFlow Server. Public endpoints require authentication with an API key, and provide support for third-party integration. Session endpoints require session authentication (login in with a user account), and are meant to be used by the TaskFlow Client. Public endpoints are those explicitly categorized with the 'Public' prefix, whereas session endpoints are the rest.",
				version: "v1.0.0"
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
