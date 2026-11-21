import { createRandomToken } from '../../shared/crypto/createRandomToken.js';
import type { RecoveryCodeRecord, TotpRecord } from './twoFactor.types.js';

export interface TwoFactorRepository 
{
  upsertPendingTotp(userId: string, secretEncrypted: string): Promise<TotpRecord | null>;
  findTotpByUserId(userId: string): Promise<TotpRecord | null>;
  enableTotp(userId: string, secretEncrypted: string, timeStep: number, codeHashes: string[]): Promise<boolean>;
  claimTotpTimeStep(userId: string, secretEncrypted: string, timeStep: number): Promise<boolean>;
  disableTotp(userId: string, secretEncrypted: string): Promise<boolean>;
  disableWithFactor(userId: string, secretEncrypted: string, factor: { timeStep: number } | { codeHash: string }): Promise<boolean>;
  replaceRecoveryCodes(userId: string, codeHashes: string[]): Promise<boolean>;
  countRemainingRecoveryCodes(userId: string): Promise<number>;
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
      id: current?.id ?? createRandomToken(16),
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

  async disableTotp(userId: string, secretEncrypted: string): Promise<boolean>
  {
    const record = this.totpRecords.get(userId);
    if (!record?.enabledAt || record.secretEncrypted !== secretEncrypted) return false;
    this.totpRecords.delete(userId);
    const now = new Date();
    for (const code of this.recoveryCodes.values()) 
    {
      if (code.userId === userId && !code.replacedAt) 
        code.replacedAt = now;
    }
    return true;
  }

  async disableWithFactor(userId: string, secretEncrypted: string, factor: { timeStep: number } | { codeHash: string }): Promise<boolean>
  {
    const record = this.totpRecords.get(userId);
    if (!record?.enabledAt || record.secretEncrypted !== secretEncrypted) return false;
    if ('timeStep' in factor) {
      if (record.lastUsedTimeStep !== null && record.lastUsedTimeStep >= factor.timeStep) return false;
    } else {
      const code = [...this.recoveryCodes.values()].find(item => item.userId === userId && item.codeHash === factor.codeHash && !item.usedAt && !item.replacedAt);
      if (!code) return false;
      code.usedAt = new Date();
    }
    return this.disableTotp(userId, secretEncrypted);
  }

  async replaceRecoveryCodes(userId: string, codeHashes: string[]): Promise<boolean>
  {
    if (!this.totpRecords.get(userId)?.enabledAt) return false;
    const now = new Date();
    for (const code of this.recoveryCodes.values()) 
    {
      if (code.userId === userId && !code.replacedAt) 
        code.replacedAt = now;
    }
    for (const codeHash of codeHashes) 
    {
      const id = createRandomToken(16);
      this.recoveryCodes.set(id, {
        id,
        userId,
        codeHash,
        createdAt: now,
        usedAt: null,
        replacedAt: null
      });
    }
    return true;
  }

  async countRemainingRecoveryCodes(userId: string): Promise<number>
  {
    return [...this.recoveryCodes.values()].filter(code => code.userId === userId && !code.usedAt && !code.replacedAt).length;
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
