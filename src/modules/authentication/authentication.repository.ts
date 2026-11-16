import { createRandomToken } from "../../shared/crypto/createRandomToken.js";
import type { PasswordCredential } from "./authentication.types.js";

export	type	LoginChallenge = {
	id: string;
	userId: string;
	tokenHash: string;
	createdAt: Date;
	expiresAt: Date;
	consumedAt: Date | null;
	ipAddress: string | null;
	userAgent: string | null;
};

export	interface	AuthenticationRepository
{
	createPasswordCredential(input: PasswordCredential): Promise<void>;

	findPasswordCredential(userId: string): Promise<PasswordCredential | null>;

	updatePasswordCredential(input: PasswordCredential): Promise<void>;

	createLoginChallenge(input: Omit<LoginChallenge, "id" | "createdAt" | "consumedAt">): Promise<LoginChallenge>;

	findLoginChallengeByTokenHash(tokenHash: string): Promise<LoginChallenge | null>;

	claimLoginChallenge(id: string, now: Date): Promise<boolean>;
}

export	class	InMemoryAuthenticationRepository	implements	AuthenticationRepository
{
	private	readonly	credentials = new Map<string, PasswordCredential>();
	private	readonly	challenges = new Map<string, LoginChallenge>();

	async	createPasswordCredential(input: PasswordCredential): Promise<void>
	{
		this.credentials.set(input.userId, input);
	}

	async	findPasswordCredential(userId: string): Promise<PasswordCredential | null>
	{
		return this.credentials.get(userId) ?? null;
	}

	async	updatePasswordCredential(input: PasswordCredential): Promise<void>
	{
		this.credentials.set(input.userId, input);
	}

	async	createLoginChallenge(input: Omit<LoginChallenge, "id" | "createdAt" | "consumedAt">): Promise<LoginChallenge>
	{
		const	challenge: LoginChallenge = {
			...input,
			id: createRandomToken(16),
			createdAt: new Date(),
			consumedAt: null
		};

		this.challenges.set(challenge.id, challenge);
		return challenge;
	}

	async	findLoginChallengeByTokenHash(tokenHash: string): Promise<LoginChallenge | null>
	{
		return [...this.challenges.values()].find((challenge) => challenge.tokenHash === tokenHash) ?? null;
	}

	async	claimLoginChallenge(id: string, now: Date): Promise<boolean>
	{
		const	challenge = this.challenges.get(id);

		if (!challenge || challenge.consumedAt || challenge.expiresAt <= now)
			return false;
		challenge.consumedAt = now;
		return true;
	}
}
