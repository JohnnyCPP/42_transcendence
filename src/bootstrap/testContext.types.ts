import type { ApiKeysService } from "../modules/apiKeys/apiKeys.service.js";
import type { AuthenticationRepository } from "../modules/authentication/authentication.repository.js";
import type { AuthenticationService } from "../modules/authentication/authentication.service.js";
import type { BoardsService } from "../modules/boards/boards.service.js";
import type { CardsService } from "../modules/cards/cards.service.js";
import type { ListsService } from "../modules/lists/lists.service.js";
import type { OrganizationsService } from "../modules/organizations/organizations.service.js";
import type { SessionsService } from "../modules/sessions/sessions.service.js";
import type { TwoFactorService } from "../modules/two_factor/twoFactor.service.js";
import type { UsersService } from "../modules/users/users.service.js";

// the types listed in the testContext object must match 
// the ones decorated in the testContext of registerTestDecorators.ts

// this is a module augmentation, it adds a "testContext" 
// property to an existing FastifyInstance interface 
// with the object shape defined here

declare module "fastify" {

	interface FastifyInstance {

			testContext: {

			apiKeysService: ApiKeysService;
			authenticationService: AuthenticationService;
			authenticationRepository: AuthenticationRepository;
			boardsService: BoardsService;
			cardsService: CardsService;
			listsService: ListsService;
			organizationsService: OrganizationsService;
			sessionsService: SessionsService;
			twoFactorService: TwoFactorService;
			usersService: UsersService;
		};
	}
}

// the export {} forces the file to be a module, 
// which makes the declaration an augmentation 
// of the FastifyInstance interface

export {};
