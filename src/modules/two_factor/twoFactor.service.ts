import { badRequest, unauthorized } from '../../shared/errors/httpErrors.js';
import type { UsersService } from '../users/users.service.js';
import type { RecoveryCodesService } from './recoveryCodes.service.js';
import type { TotpService } from './totp.service.js';
import type { TwoFactorRepository } from './twoFactor.repository.js';
import type { TotpSetup } from './twoFactor.types.js';
import { randomToken } from '../../shared/crypto/randomToken.js';
import { hashToken } from '../../shared/crypto/hashToken.js';

export class TwoFactorService 
{
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
      otpauthUri: this.totpService.provisioningUri(user.username, secret),
      manualEntryKey: secret
    };
  }

  async confirmTotpSetup(userId: string, code: string): Promise<string[]> 
  {
    const record = await this.twoFactorRepository.findTotpByUserId(userId);
    if (!record || record.enabledAt) 
      throw badRequest('No pending TOTP setup');

    const secret = this.totpService.decryptSecret(record.secretEncrypted);
    const timeStep = this.totpService.matchingTimeStep(code, secret);
    if (timeStep === null)
      throw badRequest('Invalid TOTP code');

    const codes = Array.from({ length: 10 }, () => randomToken(9));
    if (!(await this.twoFactorRepository.enableTotp(userId, record.secretEncrypted, timeStep, codes.map(hashToken))))
      throw badRequest('TOTP setup has changed or is already confirmed');
    return codes;
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

  disableTwoFactor(userId: string): Promise<void> 
  {
    return this.twoFactorRepository.disableTotp(userId);
  }
}
