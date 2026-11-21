import { describe, expect, it } from "vitest";
import { InMemoryAuthenticationRepository } from "./authentication.repository.js";

describe("InMemoryAuthenticationsRepository", () => {
  it("records expired and completed challenges and prevents reuse", async () => {
    const repository = new InMemoryAuthenticationRepository();
    const now = new Date();
    const create = (tokenHash: string, expiresAt: Date) => repository.createLoginChallenge({ userId: "user", tokenHash, expiresAt, ipAddress: null, userAgent: null });
    // Create one expired challenge and one that can still be used.
    const expired = await create("expired", new Date(now.getTime() - 1));
    const valid = await create("valid", new Date(now.getTime() + 60000));
    expect(await repository.claimLoginChallenge(expired.id, now)).toBe(false);
    // Expiration marks only overdue challenges as consumed.
    await repository.expireLoginChallenges(now);
    expect(expired.consumedAt).toEqual(now);
    expect(valid.consumedAt).toBeNull();
    // Competing claims cannot both consume the same challenge.
    expect(await Promise.all([repository.claimLoginChallenge(valid.id, now), repository.claimLoginChallenge(valid.id, now)])).toEqual([true, false]);
    expect(valid.consumedAt).toEqual(now);
  });
});
