import { badRequest, unauthorized } from '../../shared/errors/httpErrors.js';
import type { UsersService } from '../users/users.service.js';
import type { RecoveryCodesService } from './recoveryCodes.service.js';
import type { TotpService } from './totp.service.js';
import type { TwoFactorRepository } from './twoFactor.repository.js';
import type { TotpSetup } from './twoFactor.types.js';
import { createRandomToken } from '../../shared/crypto/createRandomToken.js';
import { hashToken } from '../../shared/crypto/hashToken.js';
import { InMemoryRateLimiter, getRateLimitKey } from '../../shared/http/rateLimit.js';

export class TwoFactorService 
{
  private readonly setupLimiter = new InMemoryRateLimiter(5, 10 * 60 * 1000);
  constructor(
    private readonly twoFactorRepository: TwoFactorRepository,
    private readonly usersService: UsersService,
    private readonly totpService: TotpService,
    private readonly recoveryCodesService: RecoveryCodesService
  ) {}

  async isEnabled(userId: string): Promise<boolean> 
  {
    const record = await this.twoFactorRepository.findTotpByUserId(userId);
    return Boolean(record?.enabledAt);
  }

  async beginTotpSetup(userId: string): Promise<TotpSetup> 
  {
    const user = await this.usersService.findById(userId);
    if (!user) throw unauthorized();
    if (await this.isEnabled(userId)) throw badRequest('Two-factor authentication is already enabled');

    const secret = this.totpService.generateSecret();
    if (!(await this.twoFactorRepository.upsertPendingTotp(userId, this.totpService.encryptSecret(secret))))
      throw badRequest('Two-factor authentication is already enabled');

    return {
      provisioningUri: this.totpService.provisioningUri(user.username, secret),
      manualEntryKey: secret
    };
  }

  async confirmTotpSetup(userId: string, code: string): Promise<string[]> 
  {
    // Reserve before async work so concurrent attempts cannot bypass the limit.
    this.setupLimiter.consume(getRateLimitKey('2fa-setup-user', userId));
    const record = await this.twoFactorRepository.findTotpByUserId(userId);
    if (!record || record.enabledAt) 
      throw badRequest('No pending TOTP setup');

    const secret = this.totpService.decryptSecret(record.secretEncrypted);
    const timeStep = this.totpService.matchingTimeStep(code, secret);
    if (timeStep === null)
      throw badRequest('Invalid TOTP code');

    const codes = Array.from({ length: 10 }, () => createRandomToken(9));
    if (!(await this.twoFactorRepository.enableTotp(userId, record.secretEncrypted, timeStep, codes.map(hashToken))))
      throw badRequest('TOTP setup has changed or is already confirmed');
    this.resetSetupAttempts(userId);
    return codes;
  }

  resetSetupAttempts(userId: string): void
  {
    this.setupLimiter.reset(getRateLimitKey('2fa-setup-user', userId));
  }

  async verifyTotp(userId: string, code: string): Promise<boolean> 
  {
    const record = await this.twoFactorRepository.findTotpByUserId(userId);
    if (!record?.enabledAt) 
      return false;
    const timeStep = this.totpService.matchingTimeStep(code, this.totpService.decryptSecret(record.secretEncrypted));
    return timeStep !== null && this.twoFactorRepository.claimTotpTimeStep(userId, record.secretEncrypted, timeStep);
  }

  async status(userId: string): Promise<{ enabled: boolean; confirmedAt?: Date }>
  {
    const record = await this.twoFactorRepository.findTotpByUserId(userId);
    return record?.enabledAt && record.confirmedAt ? { enabled: true, confirmedAt: record.confirmedAt } : { enabled: false };
  }

  consumeRecoveryCode(userId: string, code: string): Promise<boolean> 
  {
    return this.recoveryCodesService.consume(userId, code);
  }

  async regenerateRecoveryCodes(userId: string): Promise<string[]> 
  {
    if (!(await this.isEnabled(userId))) 
      throw badRequest('Two-factor authentication is not enabled');
    return this.recoveryCodesService.generateForUser(userId);
  }

  remainingRecoveryCodes(userId: string): Promise<number>
  {
    return this.twoFactorRepository.countRemainingRecoveryCodes(userId);
  }

  async disableTwoFactor(userId: string): Promise<void>
  {
    const record = await this.twoFactorRepository.findTotpByUserId(userId);
    if (!record?.enabledAt) throw badRequest('Two-factor authentication is not enabled');
    if (!(await this.twoFactorRepository.disableTotp(userId, record.secretEncrypted)))
      throw badRequest('Two-factor authentication has changed');
  }

  async disableWithSingleFactor(userId: string, code: string, method: 'totp' | 'recovery_code'): Promise<void>
  {
    const record = await this.twoFactorRepository.findTotpByUserId(userId);
    if (!record?.enabledAt) throw badRequest('Two-factor authentication is not enabled');
    const timeStep = method === 'totp' ? this.totpService.matchingTimeStep(code, this.totpService.decryptSecret(record.secretEncrypted)) : null;
    if (method === 'totp' && timeStep === null) throw unauthorized('Invalid second factor');
    const factor = method === 'totp' ? { timeStep: timeStep! } : { codeHash: hashToken(code.trim()) };
    if (!(await this.twoFactorRepository.disableWithFactor(userId, record.secretEncrypted, factor))) throw unauthorized('Invalid second factor');
  }
}
