import { expect, it, onTestFinished } from 'vitest';
import { buildApp } from '../../src/app.js';

it('manages organizations with isolated membership, validation and soft deletion', async () => {
  const app = await buildApp();
  onTestFinished(() => app.close());
  const owner = await app.testContext.usersService.createUser({ username: 'org-api-owner' });
  const outsider = await app.testContext.usersService.createUser({ username: 'org-api-outsider' });
  const ownerSession = await app.testContext.sessionsService.createSession({ userId: owner.id });
  const outsiderSession = await app.testContext.sessionsService.createSession({ userId: outsider.id });
  const cookie = (token: string) => `${process.env.SESSION_COOKIE_NAME ?? 'sid'}=${token}`;
  const call = (method: 'GET' | 'POST' | 'PATCH' | 'DELETE', url: string, token?: string, payload?: object) =>
    app.inject({ method, url: `/api/v1${url}`, ...(token ? { headers: { cookie: cookie(token) } } : {}), ...(payload ? { payload } : {}) });

  expect((await call('POST', '/organizations', undefined, { name: 'Example' })).statusCode).toBe(401);
  const created = await call('POST', '/organizations', ownerSession.token, { name: 'Example', description: '  Initial description  ' });
  expect(created.statusCode, created.body).toBe(200);
  expect(created.json().organization).toMatchObject({ name: 'Example', description: 'Initial description', role: 'owner' });
  const id = created.json().organization.id;
  expect((await call('GET', `/organizations/${id}`, outsiderSession.token)).statusCode).toBe(404);
  expect((await call('PATCH', `/organizations/${id}`, outsiderSession.token, { name: 'Other' })).statusCode).toBe(404);
  const updated = await call('PATCH', `/organizations/${id}`, ownerSession.token, { name: 'Renamed', description: ' Updated ' });
  expect(updated.statusCode, updated.body).toBe(200);
  expect(updated.json().organization).toMatchObject({ name: 'Renamed', description: 'Updated' });
  expect((await call('GET', `/organizations/${id}`, ownerSession.token)).json().organization.description).toBe('Updated');
  expect((await call('PATCH', `/organizations/${id}`, ownerSession.token, { description: 'x'.repeat(5001) })).statusCode).toBe(400);
  expect((await call('PATCH', `/organizations/${id}`, ownerSession.token, { description: null })).json().organization.description).toBeNull();
  expect((await call('DELETE', `/organizations/${id}`, ownerSession.token)).statusCode).toBe(200);
  expect((await call('GET', `/organizations/${id}`, ownerSession.token)).statusCode).toBe(404);
  const listed = await call('GET', '/organizations', ownerSession.token);
  expect(listed.json().organizations.some((org: { id: string }) => org.id === id)).toBe(false);
});
