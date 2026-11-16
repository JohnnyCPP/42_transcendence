import { createRandomToken } from "../../shared/crypto/createRandomToken.js";
import { conflict } from "../../shared/errors/httpErrors.js";
import type { PrismaClient } from "@prisma/client";
import type { RegistrationInput } from "./registrations.repository.js";
import type { RegistrationsRepository } from "./registrations.repository.js";
import type { User } from "../users/users.types.js";

export	class	PrismaRegistrationsRepository	implements	RegistrationsRepository
{
	constructor(private readonly prisma: PrismaClient) {}

	async	createUserWithCredential(input: RegistrationInput): Promise<User>
	{
		try
		{
			return await this.prisma.$transaction(async (tx) => {

				const	row = await tx.user.create({
					data: {
						id: createRandomToken(16),
						username: input.username.trim().toLowerCase(),
						email: input.email?.trim().toLowerCase() ?? null
					}
				});

				await tx.passwordCredential.create({
					data: {
						userId: row.id,
						passwordHash: input.passwordHash,
						passwordUpdatedAt: input.passwordUpdatedAt
					}
				});

				return {
					id: row.id,
					username: row.username,
					email: row.email,
					displayName: row.displayName,
					role: row.role as User["role"],
					status: row.status as User["status"],
					createdAt: row.createdAt,
					updatedAt: row.updatedAt
				};
			});
		}
		catch (error)
		{
			if (isUniqueViolation(error)) throw conflict("User already exists");
			throw error;
		}
	}
}

function	isUniqueViolation(error: unknown): boolean
{
	return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}
