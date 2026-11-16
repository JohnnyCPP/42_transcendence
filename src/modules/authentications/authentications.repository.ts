import { createRandomToken } from '../../shared/crypto/createRandomToken.js';
import type { PasswordCredential } from './authentications.types.js';

export type LoginChallenge = {
  id: string;
  userId: string;
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
  consumedAt: Date | null;
  failedAttempts: number;
  ipAddress: string | null;
  userAgent: string | null;
};

export	interface	AuthenticationsRepository
{
  createPasswordCredential(input: PasswordCredential): Promise<void>;
  findPasswordCredential(userId: string): Promise<PasswordCredential | null>;
  updatePasswordCredential(input: PasswordCredential): Promise<void>;
  createLoginChallenge(input: Omit<LoginChallenge, 'id' | 'createdAt' | 'consumedAt' | 'failedAttempts'>): Promise<LoginChallenge>;
  findLoginChallengeByTokenHash(tokenHash: string): Promise<LoginChallenge | null>;
  claimLoginChallenge(id: string, now: Date): Promise<boolean>;
  recordChallengeFailure(id: string, now: Date): Promise<void>;
  expireLoginChallenges(now: Date): Promise<void>;
}

export	class	InMemoryAuthenticationsRepository	implements	AuthenticationsRepository
{
  private readonly credentials = new Map<string, PasswordCredential>();
  private readonly challenges = new Map<string, LoginChallenge>();

  async createPasswordCredential(input: PasswordCredential): Promise<void> 
  {
    this.credentials.set(input.userId, input);
  }

  async findPasswordCredential(userId: string): Promise<PasswordCredential | null> 
  {
    return this.credentials.get(userId) ?? null;
  }

  async updatePasswordCredential(input: PasswordCredential): Promise<void> 
  {
    this.credentials.set(input.userId, input);
  }

  async createLoginChallenge(input: Omit<LoginChallenge, 'id' | 'createdAt' | 'consumedAt' | 'failedAttempts'>): Promise<LoginChallenge>
  {
    const challenge: LoginChallenge = {
      ...input,
      id: createRandomToken(16),
      createdAt: new Date(),
      consumedAt: null,
      failedAttempts: 0
    };
    this.challenges.set(challenge.id, challenge);
    return challenge;
  }

  async findLoginChallengeByTokenHash(tokenHash: string): Promise<LoginChallenge | null> 
  {
    return [...this.challenges.values()].find((challenge) => challenge.tokenHash === tokenHash) ?? null;
  }

  async claimLoginChallenge(id: string, now: Date): Promise<boolean>
  {
    const challenge = this.challenges.get(id);
    if (!challenge || challenge.consumedAt || challenge.expiresAt <= now || challenge.failedAttempts >= 5) return false;
    challenge.consumedAt = now;
    return true;
  }

  async recordChallengeFailure(id: string, now: Date): Promise<void>
  {
    const challenge = this.challenges.get(id);
    if (!challenge || challenge.consumedAt || challenge.expiresAt <= now || challenge.failedAttempts >= 5) return;
    challenge.failedAttempts++;
    if (challenge.failedAttempts >= 5) challenge.consumedAt = now;
  }

  async expireLoginChallenges(now: Date): Promise<void>
  {
    for (const challenge of this.challenges.values())
      if (!challenge.consumedAt && challenge.expiresAt <= now) challenge.consumedAt = now;
  }
}
