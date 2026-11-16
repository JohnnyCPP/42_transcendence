import { it, onTestFinished } from 'vitest';
import { expect } from 'vitest';
import { authenticator } from 'otplib';
import { buildApp } from '../../src/app.js';

it('2FA endpoint responses do not expose stored fields', async () => {
  const app = await buildApp();
  onTestFinished(() => app.close());
  const registration = await app.inject({ method: 'POST', url: '/auth/register', payload: { username: 'schema-user', password: 'a secure password' } });
  expect(registration.statusCode).toBe(200);
  const cookie = registration.headers['set-cookie'].split(';')[0];
  const reauth = await app.inject({ method: 'POST', url: '/auth/reauthenticate', headers: { cookie }, payload: { password: 'a secure password' } });
  expect(reauth.statusCode).toBe(200);
  const setup = await app.inject({ method: 'POST', url: '/2fa/setup', headers: { cookie } });
  expect(setup.statusCode).toBe(200);
  expect(Object.keys(setup.json())).toEqual(['provisioningUri']);
  const secret = new URL(setup.json().provisioningUri).searchParams.get('secret');
  const confirm = await app.inject({ method: 'POST', url: '/2fa/confirm', headers: { cookie }, payload: { code: authenticator.generate(secret) } });
  expect(confirm.statusCode).toBe(200);
  expect(confirm.json().recoveryCodes.length).toBe(10);
  const regenerate = await app.inject({ method: 'POST', url: '/2fa/recovery-codes/regenerate', headers: { cookie } });
  expect(regenerate.statusCode).toBe(200);
  for (const response of [registration, reauth, setup, confirm, regenerate]) {
    expect(response.body).not.toMatch(/secretEncrypted|codeHash/);
  }
});
