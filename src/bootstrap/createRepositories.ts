import { env } from "../config/env.js";
import { InMemoryApiKeysRepository } from "../modules/apiKeys/apiKeys.repository.js";
import { InMemoryAuthenticationsRepository } from "../modules/authentications/authentications.repository.js";
import { InMemoryBoardsRepository } from "../modules/boards/boards.repository.js";
import { InMemoryCardsRepository } from "../modules/cards/cards.repository.js";
import { InMemoryOrganizationsRepository } from "../modules/organizations/organizations.repository.js";
import { InMemoryRegistrationsRepository } from "../modules/authentications/registrations.repository.js";
import { InMemorySessionsRepository } from "../modules/sessions/sessions.repository.js";
import { InMemoryTwoFactorRepository } from "../modules/two_factor/twoFactor.repository.js";
import { InMemoryUsersRepository } from "../modules/users/users.repository.js";
import { InMemoryListsRepository } from "../modules/lists/lists.repository.js";
import { PrismaApiKeysRepository } from "../modules/apiKeys/apiKeys.prismaRepository.js";
import { PrismaAuthenticationsRepository } from "../modules/authentications/authentications.prismaRepository.js";
import { PrismaBoardsRepository } from "../modules/boards/boards.prismaRepository.js";
import { PrismaCardsRepository } from "../modules/cards/cards.prismaRepository.js";
import { PrismaListsRepository } from "../modules/lists/lists.prismaRepository.js";
import { PrismaOrganizationsRepository } from "../modules/organizations/organizations.prismaRepository.js";
import { PrismaRegistrationsRepository } from "../modules/authentications/registrations.prismaRepository.js";
import { PrismaSessionsRepository } from "../modules/sessions/sessions.prismaRepository.js";
import { PrismaTwoFactorRepository } from "../modules/two_factor/twoFactor.prismaRepository.js";
import { PrismaUsersRepository } from "../modules/users/users.prismaRepository.js";
import type { ApiKeysRepository } from "../modules/apiKeys/apiKeys.repository.js";
import type { AuthenticationsRepository } from "../modules/authentications/authentications.repository.js";
import type { BoardsRepository } from "../modules/boards/boards.repository.js";
import type { CardsRepository } from "../modules/cards/cards.repository.js";
import type { ListsRepository } from "../modules/lists/lists.repository.js";
import type { OrganizationsRepository } from "../modules/organizations/organizations.repository.js";
import type { PrismaClient } from "@prisma/client";
import type { RegistrationsRepository } from "../modules/authentications/registrations.repository.js";
import type { SessionsRepository } from "../modules/sessions/sessions.repository.js";
import type { TwoFactorRepository } from "../modules/two_factor/twoFactor.repository.js";
import type { UsersRepository } from "../modules/users/users.repository.js";

export	type	Repositories = 
{
	apiKeysRepository: ApiKeysRepository;
	authenticationsRepository: AuthenticationsRepository;
	boardsRepository: BoardsRepository;
	cardsRepository: CardsRepository;
	listsRepository: ListsRepository;
	organizationsRepository: OrganizationsRepository;
	registrationsRepository: RegistrationsRepository;
	sessionsRepository: SessionsRepository;
	twoFactorRepository: TwoFactorRepository;
	usersRepository: UsersRepository;
};

export	function	createRepositories(prismaClient: PrismaClient | null): Repositories
{
	let		apiKeysRepository: ApiKeysRepository;
	let		authenticationsRepository: AuthenticationsRepository;
	let		boardsRepository: BoardsRepository;
	let		cardsRepository: CardsRepository;
	let		listsRepository: ListsRepository;
	let		organizationsRepository: OrganizationsRepository;
	let		registrationsRepository: RegistrationsRepository;
	let		sessionsRepository: SessionsRepository;
	let		twoFactorRepository: TwoFactorRepository;
	let		usersRepository: UsersRepository;

	if (env.NODE_ENV == "test")
	{
		apiKeysRepository = new InMemoryApiKeysRepository();
		authenticationsRepository = new InMemoryAuthenticationsRepository();
		boardsRepository = new InMemoryBoardsRepository();
		cardsRepository = new InMemoryCardsRepository();
		listsRepository = new InMemoryListsRepository();
		organizationsRepository = new InMemoryOrganizationsRepository();
		sessionsRepository = new InMemorySessionsRepository();
		twoFactorRepository = new InMemoryTwoFactorRepository();
		usersRepository = new InMemoryUsersRepository();
		registrationsRepository = new InMemoryRegistrationsRepository(usersRepository, authenticationsRepository);
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
		authenticationsRepository = new PrismaAuthenticationsRepository(prismaClient);
		boardsRepository = new PrismaBoardsRepository(prismaClient);
		cardsRepository = new PrismaCardsRepository(prismaClient);
		listsRepository = new PrismaListsRepository(prismaClient);
		organizationsRepository = new PrismaOrganizationsRepository(prismaClient);
		registrationsRepository = new PrismaRegistrationsRepository(prismaClient);
		sessionsRepository = new PrismaSessionsRepository(prismaClient);
		twoFactorRepository = new PrismaTwoFactorRepository(prismaClient);
		usersRepository = new PrismaUsersRepository(prismaClient);
	}
	return {

		apiKeysRepository,
		authenticationsRepository,
		boardsRepository,
		cardsRepository,
		listsRepository,
		organizationsRepository,
		registrationsRepository,
		sessionsRepository,
		twoFactorRepository,
		usersRepository
	};
}
