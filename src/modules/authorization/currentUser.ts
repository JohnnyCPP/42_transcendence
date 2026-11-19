import type { ApiKeyRecord } from "../apiKeys/apiKeys.types.js";
import type { Session } from "../sessions/sessions.types.js";
import type { User } from "../users/users.types.js";

declare module "fastify" 
{
  interface FastifyRequest 
  {
    currentUser?: User;
    currentSession?: Session;
	currentApiKey?: ApiKeyRecord;
  }
}

