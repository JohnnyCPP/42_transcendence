import { afterAll, beforeAll, describe, it } from 'vitest';
import { expect } from 'vitest';
import { createHash } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { authenticator } from 'otplib';

// The runner sets NODE_ENV=development to use the real Prisma repositories.
if (!process.env.DATABASE_URL?.match(/^postgresql:\/\/local_2fa:local_2fa_only@127\.0\.0\.1:\d+\/local_2fa$/))
  throw new Error('Run this test only through npm run test:2fa:integration');
const { buildApp } = await import('../../src/app.js');
const { SecretBox } = await import('../../src/shared/crypto/encryption.js');
const secret = 'JBSWY3DPEHPK3PXP'; // Public test fixture, never a real account secret.
const password = 'local test password 123';
const hash = value => createHash('sha256').update(value).digest('hex');
const codeAt = epoch => { const generator = authenticator.clone(); generator.options = { epoch, step: 30 }; return generator.generate(secret); };
// Avoid codes valid in the previous, current or next TOTP time step.
const wrongCode = () => {
  const epoch = Date.now();
  const valid = new Set([-30_000, 0, 30_000].map(offset => codeAt(epoch + offset)));
  return ['000000', '111111', '222222', '333333'].find(code => !valid.has(code));
};

// These cases share one account and run in order through its 2FA lifecycle.
describe('2FA lifecycle over HTTP with PostgreSQL', () => {
  let app;
  const prisma = new PrismaClient();
  let account, recoveryCodes;
  beforeAll(async () => { app = await buildApp(); account = await register('lifecycle-user'); });
  afterAll(async () => { await app.close(); await prisma.$disconnect(); });
  const call = (method, url, payload, cookie) => app.inject({ method, url, ...(payload ? { payload } : {}), ...(cookie ? { headers: { cookie } } : {}) });
  const register = async username => {
    const response = await call('POST', '/api/v1/register', { username, password });
    expect(response.statusCode, response.body).toBe(200);
    return { userId: response.json().user.id, cookie: response.headers['set-cookie'].split(';')[0] };
  };
  // Use a known test secret so generated codes can be verified deterministically.
  const startSetup = async account => {
    expect((await call('POST', '/api/v1/reauthenticate', { password }, account.cookie)).statusCode).toBe(200);
    expect((await call('POST', '/api/v1/two-factor/begin', null, account.cookie)).statusCode).toBe(200);
    await prisma.twoFactorTotp.update({ where: { userId: account.userId }, data: { secretEncrypted: new SecretBox(process.env.TOTP_ENCRYPTION_KEY_BASE64).encrypt(secret) } });
  };
  const login = async () => {
    const response = await call('POST', '/api/v1/login', { username: 'lifecycle-user', password });
    expect(response.statusCode, response.body).toBe(200);
    expect(response.json().status).toBe('requires_2fa');
    expect(response.headers['set-cookie']).toBe(undefined);
    return response.json().challengeToken;
  };
  const factor = (challengeToken, code, method = 'totp') => call('POST', '/api/v1/two-factor/login', { challengeToken, code, method });

  // A rejected setup must not enable 2FA in either the API or the database.
  it('invalid setup code leaves the record pending', async () => {
    await startSetup(account);
    const response = await call('POST', '/api/v1/two-factor/confirm', { code: wrongCode() }, account.cookie);
    expect(response.statusCode).toBe(400);
    expect((await prisma.twoFactorTotp.findUniqueOrThrow({ where: { userId: account.userId } })).enabledAt).toBe(null);
    expect((await call('GET', '/api/v1/two-factor/status', null, account.cookie)).json()).toEqual({ enabled: false });
  });
  // Confirm activation and verify recovery codes are stored only as hashes.
  it('valid setup activates 2FA and stores recovery code hashes', async () => {
    // Use the previous explicit time step; the login below uses the current step.
    const response = await call('POST', '/api/v1/two-factor/confirm', { code: codeAt(Date.now() - 30_000) }, account.cookie);
    expect(response.statusCode, response.body).toBe(200);
    recoveryCodes = response.json().recoveryCodes;
    expect(recoveryCodes.length).toBe(10);
    const record = await prisma.twoFactorTotp.findUniqueOrThrow({ where: { userId: account.userId } });
    expect(record.enabledAt && record.confirmedAt).toBeTruthy();
    expect((await call('GET', '/api/v1/two-factor/status', null, account.cookie)).json().enabled).toBe(true);
    const stored = await prisma.recoveryCode.findMany({ where: { userId: account.userId } });
    expect(stored.length).toBe(10);
    expect(stored.every(row => !recoveryCodes.includes(row.codeHash))).toBeTruthy();
    expect(stored.some(row => row.codeHash === hash(recoveryCodes[0]))).toBeTruthy();
  });
  // A valid second factor creates a session; the consumed challenge cannot be replayed.
  it('TOTP login creates a session, invalid code and challenge replay are rejected', async () => {
    const token = await login();
    expect((await factor(token, wrongCode())).statusCode).toBe(401);
    const response = await factor(token, codeAt(Date.now()));
    expect(response.statusCode, response.body).toBe(200);
    expect(response.json().status).toBe('authenticated');
    expect(response.headers['set-cookie']).toBeTruthy();
    expect((await prisma.loginChallenge.findUniqueOrThrow({ where: { tokenHash: hash(token) } })).consumedAt).toBeTruthy();
    expect((await factor(token, codeAt(Date.now()))).statusCode).toBe(401);
  });
  // Recovery codes authenticate once and are marked used in PostgreSQL.
  it('recovery login consumes the code and rejects reuse', async () => {
    const first = await login();
    const response = await factor(first, recoveryCodes[0], 'recovery_code');
    expect(response.statusCode, response.body).toBe(200);
    expect(response.headers['set-cookie']).toBeTruthy();
    expect((await prisma.recoveryCode.findFirstOrThrow({ where: { userId: account.userId, codeHash: hash(recoveryCodes[0]) } })).usedAt).toBeTruthy();
    expect((await factor(await login(), recoveryCodes[0], 'recovery_code')).statusCode).toBe(401);
  });
  // Expiration rejects a challenge, while repeated failures trigger rate limiting.
  it('expired challenges are rejected', async () => {
    const token = await login();
    await prisma.loginChallenge.update({ where: { tokenHash: hash(token) }, data: { expiresAt: new Date(Date.now() - 1000) } });
    const response = await factor(token, recoveryCodes[1], 'recovery_code');
    expect(response.statusCode).toBe(401);
    expect(response.json().message).toBe('Invalid or expired login challenge');
  });
  it('five challenge failures rate-limit the challenge', async () => {
    const token = await login();
    for (let i = 0; i < 5; i++) expect((await factor(token, wrongCode())).statusCode).toBe(401);
    const record = await prisma.loginChallenge.findUniqueOrThrow({ where: { tokenHash: hash(token) } });
    expect(record.consumedAt).toBeNull();
    expect((await factor(token, recoveryCodes[1], 'recovery_code')).statusCode).toBe(429);
  });
  // Setup failures produce a temporary rate limit with a retry hint.
  it('five setup failures yield 429 and Retry-After', async () => {
    const limited = await register('lifecycle-rate-user');
    await startSetup(limited);
    const attempt = () => call('POST', '/api/v1/two-factor/confirm', { code: wrongCode() }, limited.cookie);
    for (let i = 0; i < 5; i++) expect((await attempt()).statusCode).toBe(400);
    const blocked = await attempt();
    expect(blocked.statusCode).toBe(429);
    expect(Number(blocked.headers['retry-after']) > 0).toBeTruthy();
  });
  // Disabling 2FA keeps the session and removes the second-factor login step.
  it('disabling 2FA preserves session and subsequent login needs no challenge', async () => {
    const reauth = await call('POST', '/api/v1/reauthenticate', { password, secondFactorCode: recoveryCodes[1], secondFactorMethod: 'recovery_code' }, account.cookie);
    expect(reauth.statusCode, reauth.body).toBe(200);
    const response = await call('DELETE', '/api/v1/two-factor', null, account.cookie);
    expect(response.statusCode, response.body).toBe(200);
    expect((await call('GET', '/api/v1/me', null, account.cookie)).statusCode).toBe(200);
    const next = await call('POST', '/api/v1/login', { username: 'lifecycle-user', password });
    expect(next.statusCode, next.body).toBe(200);
    expect(next.json().status).toBe('authenticated');
    expect(next.headers['set-cookie']).toBeTruthy();
  });
});
