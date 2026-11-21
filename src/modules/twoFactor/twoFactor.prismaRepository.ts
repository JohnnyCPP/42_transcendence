import { Prisma, PrismaClient } from '@prisma/client';
import { createRandomToken } from '../../shared/crypto/createRandomToken.js';
import type { TotpRecord } from './twoFactor.types.js';
import type { TwoFactorRepository } from './twoFactor.repository.js';

export class PrismaTwoFactorRepository implements TwoFactorRepository 
{
  constructor(private readonly prisma: PrismaClient) {}

  async upsertPendingTotp(userId: string, secretEncrypted: string): Promise<TotpRecord | null>
  {
    const updated = await this.prisma.twoFactorTotp.updateMany({ where: { userId, enabledAt: null }, data: { secretEncrypted, confirmedAt: null, lastUsedTimeStep: null } });
    if (updated.count) return this.findTotpByUserId(userId);
    try {
      return mapTotp(await this.prisma.twoFactorTotp.create({ data: { id: createRandomToken(16), userId, secretEncrypted } }));
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error;
      const retry = await this.prisma.twoFactorTotp.updateMany({ where: { userId, enabledAt: null }, data: { secretEncrypted, confirmedAt: null, lastUsedTimeStep: null } });
      return retry.count ? this.findTotpByUserId(userId) : null;
    }
  }

  async findTotpByUserId(userId: string): Promise<TotpRecord | null> 
  {
    const row = await this.prisma.twoFactorTotp.findUnique({ where: { userId } });
    return row ? mapTotp(row) : null;
  }

  async enableTotp(userId: string, secretEncrypted: string, timeStep: number, codeHashes: string[]): Promise<boolean>
  {
    return this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const updated = await tx.twoFactorTotp.updateMany({
        where: { userId, secretEncrypted, enabledAt: null },
        data: { enabledAt: now, confirmedAt: now, lastUsedTimeStep: timeStep }
      });
      if (!updated.count) return false;
      await tx.recoveryCode.updateMany({ where: { userId, replacedAt: null }, data: { replacedAt: now } });
      await tx.recoveryCode.createMany({ data: codeHashes.map((codeHash) => ({ id: createRandomToken(16), userId, codeHash })) });
      return true;
    });
  }

  async claimTotpTimeStep(userId: string, secretEncrypted: string, timeStep: number): Promise<boolean>
  {
    const result = await this.prisma.twoFactorTotp.updateMany({
      where: { userId, secretEncrypted, enabledAt: { not: null }, OR: [{ lastUsedTimeStep: null }, { lastUsedTimeStep: { lt: timeStep } }] },
      data: { lastUsedTimeStep: timeStep }
    });
    return result.count === 1;
  }

  async disableTotp(userId: string, secretEncrypted: string): Promise<boolean>
  {
    return this.prisma.$transaction(async tx => {
      const deleted = await tx.twoFactorTotp.deleteMany({ where: { userId, secretEncrypted, enabledAt: { not: null } } });
      if (!deleted.count) return false;
      await tx.recoveryCode.updateMany({ where: { userId, replacedAt: null }, data: { replacedAt: new Date() } });
      return true;
    });
  }

  async disableWithFactor(userId: string, secretEncrypted: string, factor: { timeStep: number } | { codeHash: string }): Promise<boolean>
  {
    return this.prisma.$transaction(async tx => {
      const now = new Date();
      const locked = await tx.twoFactorTotp.updateMany({
        where: { userId, secretEncrypted, enabledAt: { not: null }, ...('timeStep' in factor ? { OR: [{ lastUsedTimeStep: null }, { lastUsedTimeStep: { lt: factor.timeStep } }] } : {}) },
        data: { updatedAt: now }
      });
      if (!locked.count) return false;
      if ('codeHash' in factor) {
        const used = await tx.recoveryCode.updateMany({ where: { userId, codeHash: factor.codeHash, usedAt: null, replacedAt: null }, data: { usedAt: now } });
        if (used.count !== 1) return false;
      }
      await tx.twoFactorTotp.delete({ where: { userId } });
      await tx.recoveryCode.updateMany({ where: { userId, replacedAt: null }, data: { replacedAt: now } });
      return true;
    });
  }

  async replaceRecoveryCodes(userId: string, codeHashes: string[]): Promise<boolean>
  {
    return this.prisma.$transaction(async tx => {
      const now = new Date();
      // Lock the enabled TOTP row to serialize regeneration and disablement.
      const locked = await tx.twoFactorTotp.updateMany({ where: { userId, enabledAt: { not: null } }, data: { updatedAt: now } });
      if (!locked.count) return false;
      await tx.recoveryCode.updateMany({ where: { userId, replacedAt: null }, data: { replacedAt: now } });
      await tx.recoveryCode.createMany({ data: codeHashes.map(codeHash => ({ id: createRandomToken(16), userId, codeHash })) });
      return true;
    });
  }

  async countRemainingRecoveryCodes(userId: string): Promise<number>
  {
    return this.prisma.recoveryCode.count({ where: { userId, usedAt: null, replacedAt: null } });
  }

  async consumeRecoveryCodeHash(userId: string, codeHash: string): Promise<boolean>
  {
    const result = await this.prisma.recoveryCode.updateMany({
      where: { userId, codeHash, usedAt: null, replacedAt: null },
      data: { usedAt: new Date() }
    });
    return result.count === 1;
  }
}

function mapTotp(row: Awaited<ReturnType<PrismaClient['twoFactorTotp']['findUnique']>> & object): TotpRecord 
{
  return {
    id: row.id,
    userId: row.userId,
    secretEncrypted: row.secretEncrypted,
    enabledAt: row.enabledAt,
    confirmedAt: row.confirmedAt,
    lastUsedTimeStep: row.lastUsedTimeStep,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}
