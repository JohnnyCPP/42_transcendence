import { PrismaClient } from '@prisma/client';
import { randomToken } from '../../shared/crypto/randomToken.js';
import type { RecoveryCodeRecord, TotpRecord } from './twoFactor.types.js';
import type { TwoFactorRepository } from './twoFactor.repository.js';

export class PrismaTwoFactorRepository implements TwoFactorRepository 
{
  constructor(private readonly prisma: PrismaClient) {}

  async upsertPendingTotp(userId: string, secretEncrypted: string): Promise<TotpRecord> 
  {
    const row = await this.prisma.twoFactorTotp.upsert({
      where: { userId },
      create: { id: randomToken(16), userId, secretEncrypted },
      update: { secretEncrypted, enabledAt: null, confirmedAt: null }
    });
    return mapTotp(row);
  }

  async findTotpByUserId(userId: string): Promise<TotpRecord | null> 
  {
    const row = await this.prisma.twoFactorTotp.findUnique({ where: { userId } });
    return row ? mapTotp(row) : null;
  }

  async enableTotp(userId: string): Promise<void> 
  {
    await this.prisma.twoFactorTotp.update({
      where: { userId },
      data: { enabledAt: new Date(), confirmedAt: new Date() }
    });
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

  async listActiveRecoveryCodes(userId: string): Promise<RecoveryCodeRecord[]> 
  {
    const rows = await this.prisma.recoveryCode.findMany({ where: { userId, usedAt: null, replacedAt: null } });
    return rows.map(mapRecoveryCode);
  }

  async markRecoveryCodeUsed(id: string): Promise<void> 
  {
    await this.prisma.recoveryCode.updateMany({ where: { id, usedAt: null }, data: { usedAt: new Date() } });
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
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

function mapRecoveryCode(row: Awaited<ReturnType<PrismaClient['recoveryCode']['findFirst']>> & object): RecoveryCodeRecord 
{
  return {
    id: row.id,
    userId: row.userId,
    codeHash: row.codeHash,
    createdAt: row.createdAt,
    usedAt: row.usedAt,
    replacedAt: row.replacedAt
  };
}
