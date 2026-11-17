import type { ApiKeysService } from "../apiKeys/apiKeys.service.js";
import type { BoardsService } from "../boards/boards.service.js";
import type { InMemoryRateLimiter } from "../../shared/http/rateLimit.js";
import type { UsersService } from "../users/users.service.js";

export	type	PublicApiDependencies = {
	apiKeysService: ApiKeysService;
	usersService: UsersService;
	boardsService: BoardsService;
	rateLimiter: InMemoryRateLimiter;
};
