import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { ScryptPasswordHasher } from '../dist/shared/crypto/passwordHasher.js';

if (process.env.NODE_ENV !== 'development' || process.env.DEMO_SEED_CONFIRM !== 'yes')
  throw new Error('Demo seed requires NODE_ENV=development and DEMO_SEED_CONFIRM=yes');
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl || !new URL(databaseUrl).pathname.endsWith('_demo'))
  throw new Error('Demo seed requires a dedicated database whose name ends in _demo');

const prisma = new PrismaClient();
const passwordHash = await new ScryptPasswordHasher().hash('ChangeMe123456!');
const users = [
  { id: 'rbac-demo-admin', username: 'demo_admin', email: 'admin@example.com', role: 'admin', orgRole: 'owner' },
  { id: 'rbac-demo-moderator', username: 'demo_moderator', email: 'moderator@example.com', role: 'moderator', orgRole: 'admin' },
  { id: 'rbac-demo-user', username: 'demo_user', email: 'user@example.com', role: 'user', orgRole: 'member' }
];

try {
  await prisma.$transaction(async tx => {
    for (const user of users) {
      const { orgRole, ...data } = user;
      await tx.user.upsert({ where: { id: user.id }, create: { ...data, displayName: data.username },
        update: { ...data, status: 'active' } });
      await tx.passwordCredential.upsert({ where: { userId: user.id },
        create: { userId: user.id, passwordHash, passwordUpdatedAt: new Date() },
        update: { passwordHash, passwordUpdatedAt: new Date() } });
    }
    const organizationId = 'rbac-demo-organization';
    await tx.organization.upsert({ where: { id: organizationId },
      create: { id: organizationId, name: 'Equipo de demostración', slug: 'rbac-demo', createdByUserId: users[0].id },
      update: { archivedAt: null } });
    for (const user of users) await tx.organizationMember.upsert({
      where: { organizationId_userId: { organizationId, userId: user.id } },
      create: { organizationId, userId: user.id, role: user.orgRole }, update: { role: user.orgRole }
    });
    const boardId = 'rbac-demo-board';
    await tx.board.upsert({ where: { id: boardId },
      create: { id: boardId, organizationId, name: 'Tablero de demostración', createdByUserId: users[0].id },
      update: { archivedAt: null } });
    for (const [userId, role] of [[users[0].id, 'admin'], [users[2].id, 'member']])
      await tx.boardMember.upsert({ where: { boardId_userId: { boardId, userId } },
        create: { boardId, userId, role }, update: { role } });
  });
  console.log('Demo accounts, organization and board are ready.');
} finally { await prisma.$disconnect(); }
