import { ApiKeysService } from "../modules/apiKeys/apiKeys.service.js";
import { AuthenticationService } from "../modules/authentication/authentication.service.js";
import { BoardsService } from "../modules/boards/boards.service.js";
import { CardsService } from "../modules/cards/cards.service.js";
import { ListsService } from "../modules/lists/lists.service.js";
import { OrganizationsService } from "../modules/organizations/organizations.service.js";
import { PublicApiService } from "../modules/publicApi/publicApi.service.js";
import { RecoveryCodesService } from "../modules/twoFactor/recoveryCodes.service.js";
import { ScryptPasswordHasher } from "../shared/crypto/passwordHasher.js";
import { SecretBox } from "../shared/crypto/encryption.js";
import { securityConfig } from "../config/security.js";
import { SessionsService } from "../modules/sessions/sessions.service.js";
import { TotpService } from "../modules/twoFactor/totp.service.js";
import { TwoFactorService } from "../modules/twoFactor/twoFactor.service.js";
import { UsersService } from "../modules/users/users.service.js";
import type { Repositories } from "./createRepositories.js";

export	type	Services = 
{
	apiKeysService: ApiKeysService;
	authenticationService: AuthenticationService;
	boardsService: BoardsService;
	cardsService: CardsService;
	listsService: ListsService;
	organizationsService: OrganizationsService;
	publicApiService: PublicApiService;
	recoveryCodesService: RecoveryCodesService;
	sessionsService: SessionsService;
	totpService: TotpService;
	twoFactorService: TwoFactorService;
	usersService: UsersService;
};

export	function	createServices(repositories: Repositories): Services
{
	let	apiKeysService;
	let	authenticationService;
	let	boardsService;
	let	cardsService;
	let	listsService;
	let	organizationsService;
	let	publicApiService;
	let	recoveryCodesService;
	let	sessionsService;
	let	totpService;
	let	twoFactorService;
	let	usersService;

	apiKeysService = new ApiKeysService(repositories.apiKeysRepository);
	usersService = new UsersService(repositories.usersRepository);
	sessionsService = new SessionsService(repositories.sessionsRepository, usersService);
	totpService = new TotpService(new SecretBox(securityConfig.totpEncryptionKeyBase64));
	recoveryCodesService = new RecoveryCodesService(repositories.twoFactorRepository);
	twoFactorService = new TwoFactorService(repositories.twoFactorRepository, 
											usersService,
											totpService, 
											recoveryCodesService);
	authenticationService = new AuthenticationService(usersService, 
								  repositories.authenticationRepository, 
								  repositories.registrationRepository,
								  new ScryptPasswordHasher(), 
								  sessionsService,
								  twoFactorService);
	organizationsService = new OrganizationsService(repositories.organizationsRepository, usersService);
	boardsService = new BoardsService(repositories.boardsRepository, organizationsService);
	listsService = new ListsService(repositories.listsRepository, boardsService);
	cardsService = new CardsService(repositories.cardsRepository, listsService);
	publicApiService = new PublicApiService(boardsService, listsService, cardsService);
	return {

		apiKeysService,
		authenticationService,
		boardsService,
		cardsService,
		listsService,
		organizationsService,
		publicApiService,
		recoveryCodesService,
		sessionsService,
		totpService,
		twoFactorService,
		usersService
	};
}
