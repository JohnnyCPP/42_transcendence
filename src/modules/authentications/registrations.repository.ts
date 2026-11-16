import type { AuthenticationsRepository } from "./authentications.repository.js";
import type { UsersRepository } from "../users/users.repository.js";
import type { User } from "../users/users.types.js";

export	type	RegistrationInput = {
	username: string;
	email?: string | null;
	passwordHash: string;
	passwordUpdatedAt: Date;
};

export	interface	RegistrationsRepository
{
	createUserWithCredential(input: RegistrationInput): Promise<User>;
}

export	class	InMemoryRegistrationsRepository	implements	RegistrationsRepository
{
	constructor(private readonly usersRepository: UsersRepository,
				private readonly authenticationsRepository: AuthenticationsRepository) {}

	async	createUserWithCredential(input: RegistrationInput): Promise<User>
	{
		const	user = await this.usersRepository.create({ username: input.username, email: input.email });

		await this.authenticationsRepository.createPasswordCredential({
			userId: user.id,
			passwordHash: input.passwordHash,
			passwordUpdatedAt: input.passwordUpdatedAt
		});
		return user;
	}
}
