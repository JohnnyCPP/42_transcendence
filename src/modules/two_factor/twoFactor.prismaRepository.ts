import { Prisma, PrismaClient } from '@prisma/client';
import { randomToken } from '../../shared/crypto/randomToken.js';
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
      return mapTotp(await this.prisma.twoFactorTotp.create({ data: { id: randomToken(16), userId, secretEncrypted } }));
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
      await tx.recoveryCode.createMany({ data: codeHashes.map((codeHash) => ({ id: randomToken(16), userId, codeHash })) });
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

  async disableTotp(userId: string): Promise<void> 
  {
    await this.prisma.$transaction([
      this.prisma.twoFactorTotp.deleteMany({ where: { userId } }),
      this.prisma.recoveryCode.updateMany({ where: { userId, replacedAt: null }, data: { replacedAt: new Date() } })
    ]);
  }

  async replaceRecoveryCodes(userId: string, codeHashes: string[]): Promise<void> 
  {
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.recoveryCode.updateMany({ where: { userId, replacedAt: null }, data: { replacedAt: now } }),
      this.prisma.recoveryCode.createMany({
        data: codeHashes.map((codeHash) => ({ id: randomToken(16), userId, codeHash }))
      })
    ]);
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
