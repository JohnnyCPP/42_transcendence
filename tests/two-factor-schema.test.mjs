import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';

process.env.NODE_ENV = 'test';
const { SecretBox } = await import('../dist/shared/crypto/encryption.js');
const { InMemoryAuthenticationsRepository } = await import('../dist/modules/authentications/authentications.repository.js');
const { InMemoryTwoFactorRepository } = await import('../dist/modules/two_factor/twoFactor.repository.js');
const { RecoveryCodesService } = await import('../dist/modules/two_factor/recoveryCodes.service.js');
const { hashToken } = await import('../dist/shared/crypto/hashToken.js');
const { buildApp } = await import('../dist/app.js');
const { authenticator } = await import('otplib');
const { PrismaTwoFactorRepository } = await import('../dist/modules/two_factor/twoFactor.prismaRepository.js');
const { PrismaAuthenticationsRepository } = await import('../dist/modules/authentications/authentications.prismaRepository.js');

test('AES-GCM uses fresh IVs and rejects altered or malformed payloads', () => {
  const box = new SecretBox(randomBytes(32).toString('base64'));
  const first = box.encrypt('secret');
  const second = box.encrypt('secret');
  assert.notEqual(first, second);
  assert.equal(box.decrypt(first), 'secret');
  assert.equal(box.decrypt(box.encrypt('')), '');
  const parts = first.split('.');
  for (let i = 0; i < 3; i++) {
    const altered = [...parts];
    const bytes = Buffer.from(altered[i], 'base64url');
    bytes[0] ^= 1;
    altered[i] = bytes.toString('base64url');
    assert.throws(() => box.decrypt(altered.join('.')));
  }
  assert.throws(() => box.decrypt(first + '.extra'));
  assert.throws(() => new SecretBox('short'));
});

test('recovery codes are hashed and consumed once', async () => {
  const repo = new InMemoryTwoFactorRepository();
  let hashes;
  const save = repo.replaceRecoveryCodes.bind(repo);
  repo.replaceRecoveryCodes = async (id, values) => { hashes = values; await save(id, values); };
  const service = new RecoveryCodesService(repo);
  const codes = await service.generateForUser('user');
  assert.equal(codes.length, 10);
  assert.deepEqual(hashes, codes.map(hashToken));
  assert.ok(codes.every(code => !hashes.includes(code)));
  assert.deepEqual((await Promise.all([service.consume('user', codes[0]), service.consume('user', codes[0])])).sort(), [false, true]);
});

test('completed and expired challenges are recorded and cannot be claimed', async () => {
  const repo = new InMemoryAuthenticationsRepository();
  const now = new Date();
  const create = (tokenHash, expiresAt) => repo.createLoginChallenge({ userId: 'user', tokenHash, expiresAt, ipAddress: null, userAgent: null });
  const expired = await create('expired', new Date(now.getTime() - 1));
  const valid = await create('valid', new Date(now.getTime() + 60000));
  assert.equal(await repo.claimLoginChallenge(expired.id, now), false);
  await repo.expireLoginChallenges(now);
  assert.deepEqual(expired.consumedAt, now);
  assert.equal(valid.consumedAt, null);
  assert.deepEqual(await Promise.all([repo.claimLoginChallenge(valid.id, now), repo.claimLoginChallenge(valid.id, now)]), [true, false]);
  assert.deepEqual(valid.consumedAt, now);
});

test('Prisma updates consume codes and expire challenges conditionally', async () => {
  let codeUpdate, challengeUpdate;
  const prisma = {
    recoveryCode: { updateMany: async args => { codeUpdate = args; return { count: 1 }; } },
    loginChallenge: { updateMany: async args => { challengeUpdate = args; return { count: 1 }; } }
  };
  assert.equal(await new PrismaTwoFactorRepository(prisma).consumeRecoveryCodeHash('user', 'hash'), true);
  assert.deepEqual(codeUpdate.where, { userId: 'user', codeHash: 'hash', usedAt: null, replacedAt: null });
  assert.ok(codeUpdate.data.usedAt instanceof Date);
  const now = new Date();
  await new PrismaAuthenticationsRepository(prisma).expireLoginChallenges(now);
  assert.deepEqual(challengeUpdate, { where: { consumedAt: null, expiresAt: { lte: now } }, data: { consumedAt: now } });
});

test('2FA endpoint responses do not expose stored fields', async t => {
  const app = await buildApp();
  t.after(() => app.close());
  const registration = await app.inject({ method: 'POST', url: '/auth/register', payload: { username: 'schema-user', password: 'a secure password' } });
  assert.equal(registration.statusCode, 200);
  const cookie = registration.headers['set-cookie'].split(';')[0];
  const reauth = await app.inject({ method: 'POST', url: '/auth/reauthenticate', headers: { cookie }, payload: { password: 'a secure password' } });
  assert.equal(reauth.statusCode, 200);
  const setup = await app.inject({ method: 'POST', url: '/2fa/setup', headers: { cookie } });
  assert.equal(setup.statusCode, 200);
  assert.deepEqual(Object.keys(setup.json()), ['provisioningUri']);
  const secret = new URL(setup.json().provisioningUri).searchParams.get('secret');
  const confirm = await app.inject({ method: 'POST', url: '/2fa/confirm', headers: { cookie }, payload: { code: authenticator.generate(secret) } });
  assert.equal(confirm.statusCode, 200);
  assert.equal(confirm.json().recoveryCodes.length, 10);
  const regenerate = await app.inject({ method: 'POST', url: '/2fa/recovery-codes/regenerate', headers: { cookie } });
  assert.equal(regenerate.statusCode, 200);
  for (const response of [registration, reauth, setup, confirm, regenerate]) {
    assert.doesNotMatch(response.body, /secretEncrypted|codeHash/);
  }
});
