import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { authenticator } from 'otplib';

// The runner sets NODE_ENV=development to use the real Prisma repositories.
if (!process.env.DATABASE_URL?.match(/^postgresql:\/\/local_2fa:local_2fa_only@127\.0\.0\.1:\d+\/local_2fa$/))
  throw new Error('Run this test only through npm run test:2fa:integration');
const { buildApp } = await import('../dist/app.js');
const { SecretBox } = await import('../dist/shared/crypto/encryption.js');
const secret = 'JBSWY3DPEHPK3PXP'; // Public test fixture, never a real account secret.
const password = 'local test password 123';
const hash = value => createHash('sha256').update(value).digest('base64url');
const codeAt = epoch => { const generator = authenticator.clone(); generator.options = { epoch, step: 30 }; return generator.generate(secret); };
const wrongCode = () => {
  const epoch = Date.now();
  const valid = new Set([-30_000, 0, 30_000].map(offset => codeAt(epoch + offset)));
  return ['000000', '111111', '222222', '333333'].find(code => !valid.has(code));
};

test('2FA lifecycle over HTTP with PostgreSQL', async t => {
  const app = await buildApp();
  const prisma = new PrismaClient();
  t.after(async () => { await app.close(); await prisma.$disconnect(); });
  const call = (method, url, payload, cookie) => app.inject({ method, url, ...(payload ? { payload } : {}), ...(cookie ? { headers: { cookie } } : {}) });
  const register = async username => {
    const response = await call('POST', '/auth/register', { username, password });
    assert.equal(response.statusCode, 200, response.body);
    return { userId: response.json().user.id, cookie: response.headers['set-cookie'].split(';')[0] };
  };
  const startSetup = async account => {
    assert.equal((await call('POST', '/auth/reauthenticate', { password }, account.cookie)).statusCode, 200);
    assert.equal((await call('POST', '/auth/2fa/setup', null, account.cookie)).statusCode, 200);
    await prisma.twoFactorTotp.update({ where: { userId: account.userId }, data: { secretEncrypted: new SecretBox(process.env.TOTP_ENCRYPTION_KEY_BASE64).encrypt(secret) } });
  };
  const login = async () => {
    const response = await call('POST', '/auth/login', { username: 'lifecycle-user', password });
    assert.equal(response.statusCode, 200, response.body);
    assert.equal(response.json().status, 'requires_2fa');
    assert.equal(response.headers['set-cookie'], undefined);
    return response.json().challengeToken;
  };
  const factor = (challengeToken, code, method = 'totp') => call('POST', '/auth/login/2fa', { challengeToken, code, method });
  const account = await register('lifecycle-user');
  let recoveryCodes;

  await t.test('invalid setup code leaves the record pending', async () => {
    await startSetup(account);
    const response = await call('POST', '/auth/2fa/verify-setup', { code: wrongCode() }, account.cookie);
    assert.equal(response.statusCode, 400);
    assert.equal((await prisma.twoFactorTotp.findUniqueOrThrow({ where: { userId: account.userId } })).enabledAt, null);
    assert.deepEqual((await call('GET', '/auth/2fa/status', null, account.cookie)).json(), { enabled: false });
  });
  await t.test('valid setup activates 2FA and stores recovery code hashes', async () => {
    // Use the previous explicit time step; the login below uses the current step.
    const response = await call('POST', '/auth/2fa/verify-setup', { code: codeAt(Date.now() - 30_000) }, account.cookie);
    assert.equal(response.statusCode, 200, response.body);
    recoveryCodes = response.json().recoveryCodes;
    assert.equal(recoveryCodes.length, 10);
    const record = await prisma.twoFactorTotp.findUniqueOrThrow({ where: { userId: account.userId } });
    assert.ok(record.enabledAt && record.confirmedAt);
    assert.equal((await call('GET', '/auth/2fa/status', null, account.cookie)).json().enabled, true);
    const stored = await prisma.recoveryCode.findMany({ where: { userId: account.userId } });
    assert.equal(stored.length, 10);
    assert.ok(stored.every(row => !recoveryCodes.includes(row.codeHash)));
    assert.ok(stored.some(row => row.codeHash === hash(recoveryCodes[0])));
  });
  await t.test('TOTP login creates a session, invalid code and challenge replay are rejected', async () => {
    const token = await login();
    assert.equal((await factor(token, wrongCode())).statusCode, 401);
    const response = await factor(token, codeAt(Date.now()));
    assert.equal(response.statusCode, 200, response.body);
    assert.equal(response.json().status, 'authenticated');
    assert.ok(response.headers['set-cookie']);
    assert.ok((await prisma.loginChallenge.findUniqueOrThrow({ where: { tokenHash: hash(token) } })).consumedAt);
    assert.equal((await factor(token, codeAt(Date.now()))).statusCode, 401);
  });
  await t.test('recovery login consumes the code and rejects reuse', async () => {
    const first = await login();
    const response = await factor(first, recoveryCodes[0], 'recovery_code');
    assert.equal(response.statusCode, 200, response.body);
    assert.ok(response.headers['set-cookie']);
    assert.ok((await prisma.recoveryCode.findFirstOrThrow({ where: { userId: account.userId, codeHash: hash(recoveryCodes[0]) } })).usedAt);
    assert.equal((await factor(await login(), recoveryCodes[0], 'recovery_code')).statusCode, 401);
  });
  await t.test('expired challenges are rejected', async () => {
    const token = await login();
    await prisma.loginChallenge.update({ where: { tokenHash: hash(token) }, data: { expiresAt: new Date(Date.now() - 1000) } });
    const response = await factor(token, recoveryCodes[1], 'recovery_code');
    assert.equal(response.statusCode, 401);
    assert.equal(response.json().error, 'CHALLENGE_EXPIRED');
  });
  await t.test('five challenge failures invalidate the challenge', async () => {
    const token = await login();
    for (let i = 0; i < 5; i++) assert.equal((await factor(token, wrongCode())).statusCode, 401);
    const record = await prisma.loginChallenge.findUniqueOrThrow({ where: { tokenHash: hash(token) } });
    assert.equal(record.failedAttempts, 5);
    assert.ok(record.consumedAt);
    assert.equal((await factor(token, recoveryCodes[1], 'recovery_code')).statusCode, 401);
  });
  await t.test('five setup failures yield 429 and Retry-After', async () => {
    const limited = await register('lifecycle-rate-user');
    await startSetup(limited);
    const attempt = () => call('POST', '/auth/2fa/verify-setup', { code: wrongCode() }, limited.cookie);
    for (let i = 0; i < 5; i++) assert.equal((await attempt()).statusCode, 400);
    const blocked = await attempt();
    assert.equal(blocked.statusCode, 429);
    assert.ok(Number(blocked.headers['retry-after']) > 0);
  });
  await t.test('disabling 2FA preserves session and subsequent login needs no challenge', async () => {
    const response = await call('POST', '/auth/2fa/disable', { password, code: recoveryCodes[1], method: 'recovery_code' }, account.cookie);
    assert.equal(response.statusCode, 200, response.body);
    assert.equal((await call('GET', '/me', null, account.cookie)).statusCode, 200);
    const next = await call('POST', '/auth/login', { username: 'lifecycle-user', password });
    assert.equal(next.statusCode, 200, next.body);
    assert.equal(next.json().status, 'authenticated');
    assert.ok(next.headers['set-cookie']);
  });
});
