import { hashToken } from "../../shared/crypto/hashToken.js";
import { unauthorized } from "../../shared/errors/httpErrors.js";
import "./currentUser.js";
import type { ApiKeysService } from "../apiKeys/apiKeys.service.js";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { UsersService } from "../users/users.service.js";

const	API_KEY_HEADER = "x-api-key";
const	API_KEY_PREFIX = "tfk_";

export	function	requireApiKey(apiKeysService: ApiKeysService, usersService: UsersService)
{
	return async (request: FastifyRequest, _reply: FastifyReply) => {

		const	presented = request.headers[API_KEY_HEADER];
		let		apiKey;
		let		owner;

		if (typeof presented !== "string" || presented.length === 0)
		{
			request.log.info({ reason: "missing_header" }, "API key authorization failed");
			throw unauthorized();
		}
		if (!presented.startsWith(API_KEY_PREFIX))
		{
			request.log.info({ reason: "invalid_format" }, "API key authorization failed");
			throw unauthorized();
		}
		apiKey = await apiKeysService.findByHashedKey(hashToken(presented));
		if (!apiKey)
		{
			request.log.info({ reason: "unknown_key" }, "API key authorization failed");
			throw unauthorized();
		}
		if (apiKey.revokedAt)
		{
			request.log.info({ keyId: apiKey.id, reason: "revoked" }, "API key authorization failed");
			throw unauthorized();
		}
		owner = await usersService.findById(apiKey.createdById);
		if (!owner || owner.status !== "active")
		{
			request.log.info({ keyId: apiKey.id, reason: "inactive_owner" }, "API key authorization failed");
			throw unauthorized();
		}
		request.currentUser = owner;
		request.currentApiKey = apiKey;
		await apiKeysService.touchLastUsedAt(apiKey.id);
	};
}
