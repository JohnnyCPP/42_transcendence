import { randomToken } from '../../shared/crypto/randomToken.js';
import type { RecoveryCodeRecord, TotpRecord } from './twoFactor.types.js';

export interface TwoFactorRepository 
{
  upsertPendingTotp(userId: string, secretEncrypted: string): Promise<TotpRecord | null>;
  findTotpByUserId(userId: string): Promise<TotpRecord | null>;
  enableTotp(userId: string, secretEncrypted: string, timeStep: number, codeHashes: string[]): Promise<boolean>;
  claimTotpTimeStep(userId: string, secretEncrypted: string, timeStep: number): Promise<boolean>;
  disableTotp(userId: string): Promise<void>;
  replaceRecoveryCodes(userId: string, codeHashes: string[]): Promise<void>;
  consumeRecoveryCodeHash(userId: string, codeHash: string): Promise<boolean>;
}

export class InMemoryTwoFactorRepository implements TwoFactorRepository 
{
  private readonly totpRecords = new Map<string, TotpRecord>();
  private readonly recoveryCodes = new Map<string, RecoveryCodeRecord>();

  async upsertPendingTotp(userId: string, secretEncrypted: string): Promise<TotpRecord | null>
  {
    const now = new Date();
    const current = this.totpRecords.get(userId);
    if (current?.enabledAt) return null;
    const record: TotpRecord = {
      id: current?.id ?? randomToken(16),
      userId,
      secretEncrypted,
      enabledAt: null,
      confirmedAt: null,
      lastUsedTimeStep: null,
      createdAt: current?.createdAt ?? now,
      updatedAt: now
    };
    this.totpRecords.set(userId, record);
    return record;
  }

  async findTotpByUserId(userId: string): Promise<TotpRecord | null> 
  {
    return this.totpRecords.get(userId) ?? null;
  }

  async enableTotp(userId: string, secretEncrypted: string, timeStep: number, codeHashes: string[]): Promise<boolean>
  {
    const record = this.totpRecords.get(userId);
    if (!record || record.enabledAt || record.secretEncrypted !== secretEncrypted) return false;
    const now = new Date();
    record.enabledAt = now;
    record.confirmedAt = now;
    record.lastUsedTimeStep = timeStep;
    record.updatedAt = now;
    await this.replaceRecoveryCodes(userId, codeHashes);
    return true;
  }

  async claimTotpTimeStep(userId: string, secretEncrypted: string, timeStep: number): Promise<boolean>
  {
    const record = this.totpRecords.get(userId);
    if (!record?.enabledAt || record.secretEncrypted !== secretEncrypted ||
        (record.lastUsedTimeStep !== null && record.lastUsedTimeStep >= timeStep)) return false;
    record.lastUsedTimeStep = timeStep;
    return true;
  }

  async disableTotp(userId: string): Promise<void> 
  {
    this.totpRecords.delete(userId);
    const now = new Date();
    for (const code of this.recoveryCodes.values()) 
    {
      if (code.userId === userId && !code.replacedAt) 
        code.replacedAt = now;
    }
  }

  async replaceRecoveryCodes(userId: string, codeHashes: string[]): Promise<void> 
  {
    const now = new Date();
    for (const code of this.recoveryCodes.values()) 
    {
      if (code.userId === userId && !code.replacedAt) 
        code.replacedAt = now;
    }
    for (const codeHash of codeHashes) 
    {
      const id = randomToken(16);
      this.recoveryCodes.set(id, {
        id,
        userId,
        codeHash,
        createdAt: now,
        usedAt: null,
        replacedAt: null
      });
    }
  }

  async consumeRecoveryCodeHash(userId: string, codeHash: string): Promise<boolean>
  {
    for (const code of this.recoveryCodes.values())
    {
      if (code.userId === userId && code.codeHash === codeHash && !code.usedAt && !code.replacedAt)
      {
        code.usedAt = new Date();
        return true;
      }
    }
    return false;
  }
}
