import { describe, expect, it, vi } from "vitest";
import { hashToken } from "../../shared/crypto/hashToken.js";
import { InMemoryTwoFactorRepository } from "./twoFactor.repository.js";
import { RecoveryCodesService } from "./recoveryCodes.service.js";

describe("RecoveryCodesService", () => {
  it("stores hashes and consumes each code only once", async () => {
    const repository = new InMemoryTwoFactorRepository();
    // Recovery codes may be generated only after 2FA has been enabled.
    await repository.upsertPendingTotp("user", "secret");
    await repository.enableTotp("user", "secret", 0, []);
    const save = vi.spyOn(repository, "replaceRecoveryCodes");
    const service = new RecoveryCodesService(repository);
    const codes = await service.generateForUser("user");
    // The caller receives ten plaintext codes; the repository receives hashes.
    expect(codes).toHaveLength(10);
    expect(save).toHaveBeenCalledWith("user", codes.map(hashToken));
    expect(codes.every(code => !codes.map(hashToken).includes(code))).toBe(true);
    // Concurrent attempts to consume the same code can succeed only once.
    expect((await Promise.all([service.consume("user", codes[0]), service.consume("user", codes[0])])).sort()).toEqual([false, true]);
  });
});
