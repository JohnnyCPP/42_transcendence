import { hashToken } from '../../shared/crypto/hashToken.js';
import { randomToken } from '../../shared/crypto/randomToken.js';
import type { TwoFactorRepository } from './twoFactor.repository.js';
import { badRequest } from '../../shared/errors/httpErrors.js';

export class RecoveryCodesService 
{
  constructor(private readonly twoFactorRepository: TwoFactorRepository) {}

  async generateForUser(userId: string): Promise<string[]> 
  {
    const codes = Array.from({ length: 10 }, () => randomToken(9));
    if (!(await this.twoFactorRepository.replaceRecoveryCodes(userId, codes.map(hashToken))))
      throw badRequest('Two-factor authentication is not enabled');
    return codes;
  }

  async consume(userId: string, code: string): Promise<boolean> 
  {
    const codeHash = hashToken(code.trim());
    // The repository consumes the code conditionally in one atomic operation.
    return this.twoFactorRepository.consumeRecoveryCodeHash(userId, codeHash);
  }
}
