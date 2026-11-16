import { ApiKeysService } from "../modules/apiKeys/apiKeys.service.js";
import { AuthenticationsService } from "../modules/authentications/authentications.service.js";
import { BoardsService } from "../modules/boards/boards.service.js";
import { CardsService } from "../modules/cards/cards.service.js";
import { CommentsService } from "../modules/comments/comments.service.js";
import { ListsService } from "../modules/lists/lists.service.js";
import { OrganizationsService } from "../modules/organizations/organizations.service.js";
import { RecoveryCodesService } from "../modules/two_factor/recoveryCodes.service.js";
import { ScryptPasswordHasher } from "../shared/crypto/passwordHasher.js";
import { SecretBox } from "../shared/crypto/encryption.js";
import { securityConfig } from "../config/security.js";
import { SessionsService } from "../modules/sessions/sessions.service.js";
import { TotpService } from "../modules/two_factor/totp.service.js";
import { TwoFactorService } from "../modules/two_factor/twoFactor.service.js";
import { UsersService } from "../modules/users/users.service.js";
import type { Repositories } from "./createRepositories.js";

export	type	Services = 
{
	apiKeysService: ApiKeysService;
	authenticationsService: AuthenticationsService;
	boardsService: BoardsService;
	cardsService: CardsService;
	commentsService: CommentsService;
	listsService: ListsService;
	organizationsService: OrganizationsService;
	recoveryCodesService: RecoveryCodesService;
	sessionsService: SessionsService;
	totpService: TotpService;
	twoFactorService: TwoFactorService;
	usersService: UsersService;
};

export	function	createServices(repositories: Repositories): Services
{
	let	apiKeysService;
	let	authenticationsService;
	let	boardsService;
	let	cardsService;
	let	listsService;
	let	organizationsService;
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
	authenticationsService = new AuthenticationsService(usersService, 
								  repositories.authenticationsRepository, 
								  repositories.registrationsRepository,
								  new ScryptPasswordHasher(), 
								  sessionsService,
								  twoFactorService);
	organizationsService = new OrganizationsService(repositories.organizationsRepository, usersService);
	boardsService = new BoardsService(repositories.boardsRepository, organizationsService);
	listsService = new ListsService(repositories.listsRepository, boardsService);
	cardsService = new CardsService(repositories.cardsRepository, listsService);
	const commentsService = new CommentsService(repositories.commentsRepository, cardsService);
	return {

		apiKeysService,
		authenticationsService,
		boardsService,
		cardsService,
		commentsService,
		listsService,
		organizationsService,
		recoveryCodesService,
		sessionsService,
		totpService,
		twoFactorService,
		usersService
	};
}
