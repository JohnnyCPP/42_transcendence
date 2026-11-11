import { AppError } from './shared/errors/AppError.js';
import { AuthService } from './modules/auth/auth.service.js';
import { BoardsService } from './modules/boards/boards.service.js';
import { CardsService } from './modules/cards/cards.service.js';
import { createPrismaClient } from './db/createPrismaClient.js';
import cookie from '@fastify/cookie';
import { env } from './config/env.js';
import Fastify from 'fastify';
import {
  hasZodFastifySchemaValidationErrors,
  validatorCompiler
} from 'fastify-type-provider-zod';
import { InMemoryAuthRepository } from './modules/auth/auth.repository.js';
import { InMemoryBoardsRepository } from './modules/boards/boards.repository.js';
import { InMemoryCardsRepository } from './modules/cards/cards.repository.js';
import { InMemoryOrganizationsRepository } from './modules/organizations/organizations.repository.js';
import {
  InMemoryRegistrationRepository,
  PrismaRegistrationRepository
} from './modules/auth/registration.repository.js';
import { InMemorySessionsRepository } from './modules/sessions/sessions.repository.js';
import { InMemoryTwoFactorRepository } from './modules/two_factor/twoFactor.repository.js';
import { InMemoryUsersRepository } from './modules/users/users.repository.js';
import { InMemoryListsRepository } from './modules/lists/lists.repository.js';
import { ListsService } from './modules/lists/lists.service.js';
import { OrganizationsService } from './modules/organizations/organizations.service.js';
import { PrismaAuthRepository } from './modules/auth/auth.prismaRepository.js';
import { PrismaBoardsRepository } from './modules/boards/boards.prismaRepository.js';
import { PrismaCardsRepository } from './modules/cards/cards.prismaRepository.js';
import { PrismaListsRepository } from './modules/lists/lists.prismaRepository.js';
import { PrismaOrganizationsRepository } from './modules/organizations/organizations.prismaRepository.js';
import { PrismaSessionsRepository } from './modules/sessions/sessions.prismaRepository.js';
import { PrismaTwoFactorRepository } from './modules/two_factor/twoFactor.prismaRepository.js';
import { PrismaUsersRepository } from './modules/users/users.prismaRepository.js';
import { RecoveryCodesService } from './modules/two_factor/recoveryCodes.service.js';
import { registerAuthRoutes } from './modules/auth/auth.routes.js';
import { registerBoardRoutes } from './modules/boards/boards.routes.js';
import { registerCardRoutes } from './modules/cards/cards.routes.js';
import { registerListRoutes } from './modules/lists/lists.routes.js';
import { registerOrganizationRoutes } from './modules/organizations/organizations.routes.js';
import { registerTwoFactorRoutes } from './modules/two_factor/twoFactor.routes.js';
import { registerUiRoutes } from './ui/ui.routes.js';
import { registerUserRoutes } from './modules/users/users.routes.js';
import { ScryptPasswordHasher } from './shared/crypto/passwordHasher.js';
import { SecretBox } from './shared/crypto/encryption.js';
import { securityConfig } from './config/security.js';
import { SessionsService } from './modules/sessions/sessions.service.js';
import { TotpService } from './modules/two_factor/totp.service.js';
import { TwoFactorService } from './modules/two_factor/twoFactor.service.js';
import { UsersService } from './modules/users/users.service.js';


import type { AuthRepository } from './modules/auth/auth.repository.js';
import type { BoardsRepository } from './modules/boards/boards.repository.js';
import type { CardsRepository } from './modules/cards/cards.repository.js';
import type { ListsRepository } from './modules/lists/lists.repository.js';
import type { OrganizationsRepository } from './modules/organizations/organizations.repository.js';
import type { PrismaClient } from '@prisma/client';
import type { RegistrationRepository } from './modules/auth/registration.repository.js';
import type { SessionsRepository } from './modules/sessions/sessions.repository.js';
import type { TwoFactorRepository } from './modules/two_factor/twoFactor.repository.js';
import type { UsersRepository } from './modules/users/users.repository.js';


export async function buildApp() 
{
// ----------------------------------- 
// Fastify and Zod validation compiler
// ----------------------------------- 

	const	app = Fastify({ logger: env.NODE_ENV !== "test" });

	app.setValidatorCompiler(validatorCompiler);
	/* Si un usuario envía una peticion HTTP con el cuerpo completamente vacio 
	en lugar de que Fastify rechace la peticion de inmediato con
	un error generico, lo transforma en un objeto vacio {} para que Zod sea el 
	que decida que error devolver de forma controlada. */
	app.addContentTypeParser("application/json", { parseAs: "string" }, (_request, body, done) => {

		const rawBody = body.toString();
		if (!rawBody.trim()) 
		{
			done(null, {});
			return;
		}
		try 
		{
			done(null, JSON.parse(rawBody));
		}
		catch (_error)
		{
			done(new AppError("Malformed JSON request body", 400, "INVALID_JSON"));
		}
	});
	// Permite que Fastify pueda leer y escribir cookies en las peticiones HTTP
	await app.register(cookie);

// --------------------------------- 
// Prisma repositories
// --------------------------------- 

	let		authRepository: AuthRepository;
	let		boardsRepository: BoardsRepository;
	let		cardsRepository: CardsRepository;
	let		listsRepository: ListsRepository;
	let		organizationsRepository: OrganizationsRepository;
	let		registrationRepository: RegistrationRepository;
	let		sessionsRepository: SessionsRepository;
	let		twoFactorRepository: TwoFactorRepository;
	let		usersRepository: UsersRepository;
	const	prismaClient: PrismaClient | null = createPrismaClient();

	if (prismaClient) 
	{
		app.addHook("onClose", async () => { await prismaClient.$disconnect(); });
	}
	if (env.NODE_ENV == "test")
	{
		authRepository = new InMemoryAuthRepository();
		boardsRepository = new InMemoryBoardsRepository();
		cardsRepository = new InMemoryCardsRepository();
		listsRepository = new InMemoryListsRepository();
		organizationsRepository = new InMemoryOrganizationsRepository();
		sessionsRepository = new InMemorySessionsRepository();
		twoFactorRepository = new InMemoryTwoFactorRepository();
		usersRepository = new InMemoryUsersRepository();
		registrationRepository = new InMemoryRegistrationRepository(usersRepository, authRepository);
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
		authRepository = new PrismaAuthRepository(prismaClient);
		boardsRepository = new PrismaBoardsRepository(prismaClient);
		cardsRepository = new PrismaCardsRepository(prismaClient);
		listsRepository = new PrismaListsRepository(prismaClient);
		organizationsRepository = new PrismaOrganizationsRepository(prismaClient);
		registrationRepository = new PrismaRegistrationRepository(prismaClient);
		sessionsRepository = new PrismaSessionsRepository(prismaClient);
		twoFactorRepository = new PrismaTwoFactorRepository(prismaClient);
		usersRepository = new PrismaUsersRepository(prismaClient);
	}

// --------------------------------- 
// Prisma services
// --------------------------------- 

	const	usersService = new UsersService(usersRepository);
	const	sessionsService = new SessionsService(sessionsRepository, usersService);
	const	totpService = new TotpService(new SecretBox(securityConfig.totpEncryptionKeyBase64));
	const	recoveryCodesService = new RecoveryCodesService(twoFactorRepository);
	const	twoFactorService = new TwoFactorService(twoFactorRepository, usersService,
													totpService, recoveryCodesService);
	const	authService = new AuthService(usersService, authRepository, registrationRepository,
											new ScryptPasswordHasher(), sessionsService,
											twoFactorService);
	const	organizationsService = new OrganizationsService(organizationsRepository, usersService);
	const	boardsService = new BoardsService(boardsRepository, organizationsService);
	const	listsService = new ListsService(listsRepository, boardsService);
	const	cardsService = new CardsService(cardsRepository, listsService);

// --------------------------------- 
// App decorators for test environment ???
// --------------------------------- 

	if (env.NODE_ENV === "test") 
	{
		app.decorate("testContext", {

			authRepository,
			authService,
			boardsService,
			cardsService,
			listsService,
			organizationsService,
			sessionsService,
			twoFactorService,
			usersService,
		});
	}

// --------------------------------- 
// App error handlers
// --------------------------------- 

	app.setErrorHandler((error, _request, reply) => {

		if (error instanceof AppError)
		{
			return reply.status(error.statusCode).send({

				error: error.code, 
				message: error.message 
			});
		}
		if (hasZodFastifySchemaValidationErrors(error))
		{
			return reply.status(400).send({

				error: "VALIDATION_ERROR", 
				message: "Invalid request body"
			});
		}
		app.log.error(error);
		return reply.status(500).send({

			error: "INTERNAL_ERROR",
			message: "Internal server error"
		});
	});

// --------------------------------- 
// App health check
// --------------------------------- 

	app.get("/health", async (_request, reply) => {

		try 
		{
			if (!prismaClient) 
			{
				throw new Error("Database is not configured");
			}
			await prismaClient.$queryRaw`SELECT 1`;
			return { ok: true };
		} 
		catch 
		{
			app.log.warn("Health check failed: database unavailable");
			return reply.status(503).send({ ok: false });
		}
	});

// --------------------------------- 
// App routes
// --------------------------------- 

	await registerUiRoutes(app);
	await registerAuthRoutes(app, authService, sessionsService);
	await registerOrganizationRoutes(app, organizationsService, sessionsService);
	await registerBoardRoutes(app, boardsService, sessionsService);
	await registerListRoutes(app, listsService, sessionsService);
	await registerCardRoutes(app, cardsService, sessionsService);
	await registerTwoFactorRoutes(app, twoFactorService, sessionsService);
	await registerUserRoutes(app, sessionsService, usersService);

	return app;
}
