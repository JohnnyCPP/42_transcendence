import { env } from "../config/env.js";
import { InMemoryApiKeysRepository } from "../modules/apiKeys/apiKeys.repository.js";
import { InMemoryAuthenticationRepository } from "../modules/authentication/authentication.repository.js";
import { InMemoryBoardsRepository } from "../modules/boards/boards.repository.js";
import { InMemoryCardsRepository } from "../modules/cards/cards.repository.js";
import { InMemoryOrganizationsRepository } from "../modules/organizations/organizations.repository.js";
import { InMemoryRegistrationRepository } from "../modules/authentication/registration.repository.js";
import { InMemorySessionsRepository } from "../modules/sessions/sessions.repository.js";
import { InMemoryTwoFactorRepository } from "../modules/twoFactor/twoFactor.repository.js";
import { InMemoryUsersRepository } from "../modules/users/users.repository.js";
import { InMemoryListsRepository } from "../modules/lists/lists.repository.js";
import { PrismaApiKeysRepository } from "../modules/apiKeys/apiKeys.prismaRepository.js";
import { PrismaAuthenticationRepository } from "../modules/authentication/authentication.prismaRepository.js";
import { PrismaBoardsRepository } from "../modules/boards/boards.prismaRepository.js";
import { PrismaCardsRepository } from "../modules/cards/cards.prismaRepository.js";
import { PrismaListsRepository } from "../modules/lists/lists.prismaRepository.js";
import { PrismaOrganizationsRepository } from "../modules/organizations/organizations.prismaRepository.js";
import { PrismaRegistrationRepository } from "../modules/authentication/registration.prismaRepository.js";
import { PrismaSessionsRepository } from "../modules/sessions/sessions.prismaRepository.js";
import { PrismaTwoFactorRepository } from "../modules/twoFactor/twoFactor.prismaRepository.js";
import { PrismaUsersRepository } from "../modules/users/users.prismaRepository.js";
import type { ApiKeysRepository } from "../modules/apiKeys/apiKeys.repository.js";
import type { AuthenticationRepository } from "../modules/authentication/authentication.repository.js";
import type { BoardsRepository } from "../modules/boards/boards.repository.js";
import type { CardsRepository } from "../modules/cards/cards.repository.js";
import type { ListsRepository } from "../modules/lists/lists.repository.js";
import type { OrganizationsRepository } from "../modules/organizations/organizations.repository.js";
import type { PrismaClient } from "@prisma/client";
import type { RegistrationRepository } from "../modules/authentication/registration.repository.js";
import type { SessionsRepository } from "../modules/sessions/sessions.repository.js";
import type { TwoFactorRepository } from "../modules/twoFactor/twoFactor.repository.js";
import type { UsersRepository } from "../modules/users/users.repository.js";

export	type	Repositories = 
{
	apiKeysRepository: ApiKeysRepository;
	authenticationRepository: AuthenticationRepository;
	boardsRepository: BoardsRepository;
	cardsRepository: CardsRepository;
	listsRepository: ListsRepository;
	organizationsRepository: OrganizationsRepository;
	registrationRepository: RegistrationRepository;
	sessionsRepository: SessionsRepository;
	twoFactorRepository: TwoFactorRepository;
	usersRepository: UsersRepository;
};

export	function	createRepositories(prismaClient: PrismaClient | null): Repositories
{
	let		apiKeysRepository: ApiKeysRepository;
	let		authenticationRepository: AuthenticationRepository;
	let		boardsRepository: BoardsRepository;
	let		cardsRepository: CardsRepository;
	let		listsRepository: ListsRepository;
	let		organizationsRepository: OrganizationsRepository;
	let		registrationRepository: RegistrationRepository;
	let		sessionsRepository: SessionsRepository;
	let		twoFactorRepository: TwoFactorRepository;
	let		usersRepository: UsersRepository;

	if (env.NODE_ENV == "test")
	{
		apiKeysRepository = new InMemoryApiKeysRepository();
		authenticationRepository = new InMemoryAuthenticationRepository();
		boardsRepository = new InMemoryBoardsRepository();
		cardsRepository = new InMemoryCardsRepository();
		listsRepository = new InMemoryListsRepository();
		organizationsRepository = new InMemoryOrganizationsRepository();
		sessionsRepository = new InMemorySessionsRepository();
		twoFactorRepository = new InMemoryTwoFactorRepository();
		usersRepository = new InMemoryUsersRepository();
		registrationRepository = new InMemoryRegistrationRepository(usersRepository, authenticationRepository);
	}
	else
	{
		if (!prismaClient) 
		{
			throw new Error(
				"Prisma client is not available. This is a fatal configuration error: " +
				"the application cannot run in development or production without a database. " +
				"Check DATABASE_URL and run \"prisma generate\"."
			);
		}
		apiKeysRepository = new PrismaApiKeysRepository(prismaClient);
		authenticationRepository = new PrismaAuthenticationRepository(prismaClient);
		boardsRepository = new PrismaBoardsRepository(prismaClient);
		cardsRepository = new PrismaCardsRepository(prismaClient);
		listsRepository = new PrismaListsRepository(prismaClient);
		organizationsRepository = new PrismaOrganizationsRepository(prismaClient);
		registrationRepository = new PrismaRegistrationRepository(prismaClient);
		sessionsRepository = new PrismaSessionsRepository(prismaClient);
		twoFactorRepository = new PrismaTwoFactorRepository(prismaClient);
		usersRepository = new PrismaUsersRepository(prismaClient);
	}
	return {

		apiKeysRepository,
		authenticationRepository,
		boardsRepository,
		cardsRepository,
		listsRepository,
		organizationsRepository,
		registrationRepository,
		sessionsRepository,
		twoFactorRepository,
		usersRepository
	};
}
