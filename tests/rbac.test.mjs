// Story 11.7: authorization rules for global, organization and board roles.
import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.SESSION_COOKIE_NAME = 'rbac_test_sid';
process.env.TOTP_ENCRYPTION_KEY_BASE64 = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
const { buildApp } = await import('../dist/app.js');

async function fixture(names) {
  const app = await buildApp();
  const accounts = {};
  for (const name of names) {
    const user = await app.testContext.usersService.createUser({ username: `rbac-${name}` });
    const session = await app.testContext.sessionsService.createSession({ userId: user.id });
    accounts[name] = { user, cookie: `rbac_test_sid=${session.token}` };
  }
  const call = async (who, method, url, payload) => {
    const response = await app.inject({ method, url, headers: { cookie: accounts[who].cookie }, ...(payload === undefined ? {} : { payload }) });
    return { status: response.statusCode, body: response.json() };
  };
  const expect = async (who, method, url, status, payload) => {
    const result = await call(who, method, url, payload);
    assert.equal(result.status, status, `${who} ${method} ${url}: ${JSON.stringify(result.body)}`);
    return result.body;
  };
  return { app, accounts, expect, call };
}

test('global roles: user management and last administrator', async t => {
  const { app, accounts: a, expect } = await fixture(['admin', 'admin2', 'moderator', 'user', 'target']);
  t.after(() => app.close());
  const service = app.testContext.usersService;
  await service.updateManagedUser('fixture', a.admin.user.id, { role: 'admin' });
  await service.updateManagedUser('fixture', a.admin2.user.id, { role: 'admin' });
  await service.updateManagedUser('fixture', a.moderator.user.id, { role: 'moderator' });
  const id = a.target.user.id;
  for (const actor of ['user', 'moderator', 'admin']) await expect(actor, 'GET', '/me', 200);
  for (const actor of ['moderator', 'admin']) {
    await expect(actor, 'GET', '/users?role=user&status=active', 200);
    const result = await expect(actor, 'GET', `/users/${id}`, 200);
    assert.equal('passwordHash' in result.user, false);
    assert.equal('secretEncrypted' in result.user, false);
  }
  for (const method of ['GET', 'PATCH', 'DELETE']) await expect('user', method, method === 'GET' ? '/users' : `/users/${id}`, 403, method === 'PATCH' ? { displayName: 'No' } : undefined);
  await expect('moderator', 'GET', '/admin/users', 403);
  await expect('admin', 'GET', '/admin/users', 200);
  await expect('moderator', 'PATCH', `/users/${id}`, 403, { displayName: 'No' });
  await expect('moderator', 'DELETE', `/users/${id}`, 403);
  await expect('admin', 'PATCH', `/users/${a.admin.user.id}`, 403, { role: 'user' });
  await expect('admin', 'PATCH', `/users/${a.admin.user.id}`, 403, { status: 'disabled' });
  await expect('admin', 'DELETE', `/users/${a.admin.user.id}`, 403);
  await expect('admin', 'PATCH', `/users/${id}`, 200, { displayName: 'Updated', status: 'disabled' });
  await expect('admin', 'DELETE', `/users/${id}`, 200);
  const page = await expect('admin', 'GET', '/users', 200);
  assert.equal(page.users.some(user => user.id === id), false);
  await expect('admin', 'GET', `/users/${id}`, 404);
  await expect('admin', 'PATCH', `/users/${a.admin2.user.id}`, 200, { role: 'user' });
  await expect('admin2', 'PATCH', `/users/${a.admin.user.id}`, 403, { role: 'user' });
  await assert.rejects(() => service.updateManagedUser('fixture', a.admin.user.id, { role: 'user' }), error => error.code === 'LAST_ADMIN');
});

test('organization roles: membership, settings, boards and archive', async t => {
  const { app, accounts: a, expect } = await fixture(['owner', 'admin', 'member', 'target', 'outsider']);
  t.after(() => app.close());
  const org = await app.testContext.organizationsService.createOrganization({ name: 'RBAC organization', createdByUserId: a.owner.user.id });
  const base = `/organizations/${org.id}`;
  const membership = who => `${base}/members/${a[who].user.id}`;
  await expect('owner', 'PUT', membership('admin'), 200, { role: 'admin' });
  await expect('owner', 'PUT', membership('member'), 200, { role: 'member' });
  await expect('admin', 'PUT', membership('target'), 200, { role: 'member' });
  for (const who of ['owner', 'admin', 'member']) {
    await expect(who, 'GET', base, 200);
    await expect(who, 'GET', `${base}/boards`, 200);
  }
  await expect('outsider', 'GET', base, 404);
  await expect('member', 'PATCH', base, 403, { name: 'No' });
  await expect('admin', 'PATCH', base, 200, { name: 'Updated' });
  await expect('member', 'POST', `${base}/boards`, 403, { name: 'No' });
  await expect('admin', 'POST', `${base}/boards`, 200, { name: 'Allowed' });
  await expect('member', 'PUT', membership('target'), 403, { role: 'member' });
  await expect('admin', 'PUT', membership('target'), 403, { role: 'admin' });
  await expect('owner', 'PUT', membership('target'), 200, { role: 'admin' });
  await expect('admin', 'DELETE', membership('target'), 403);
  await expect('owner', 'PUT', membership('target'), 200, { role: 'member' });
  await expect('member', 'DELETE', membership('target'), 403);
  await expect('admin', 'DELETE', membership('owner'), 403);
  await expect('admin', 'DELETE', membership('target'), 200);
  await expect('owner', 'DELETE', membership('admin'), 200);
  await expect('member', 'DELETE', base, 403);
  await expect('owner', 'DELETE', base, 200);
  await expect('owner', 'GET', base, 404);
});

test('board roles: read, writes, membership and archive', async t => {
  const { app, accounts: a, expect } = await fixture(['owner', 'orgadmin', 'boardadmin', 'member', 'observer', 'reader', 'outsider']);
  t.after(() => app.close());
  const org = await app.testContext.organizationsService.createOrganization({ name: 'Board roles', createdByUserId: a.owner.user.id });
  const orgUrl = `/organizations/${org.id}`;
  for (const name of ['orgadmin', 'boardadmin', 'member', 'observer', 'reader'])
    await expect('owner', 'PUT', `${orgUrl}/members/${a[name].user.id}`, 200, { role: name === 'orgadmin' ? 'admin' : 'member' });
  const created = await expect('owner', 'POST', `${orgUrl}/boards`, 200, { name: 'Board' });
  const base = `/boards/${created.board.id}`;
  const membership = who => `${base}/members/${a[who].user.id}`;
  for (const [name, role] of [['boardadmin', 'admin'], ['member', 'member'], ['observer', 'observer']])
    await expect('orgadmin', 'PUT', membership(name), 200, { role });
  for (const who of ['owner', 'orgadmin', 'boardadmin', 'member', 'observer', 'reader']) {
    await expect(who, 'GET', base, 200);
    await expect(who, 'GET', `${base}/lists`, 200);
  }
  await expect('outsider', 'GET', base, 404);
  for (const who of ['reader', 'observer']) {
    await expect(who, 'POST', `${base}/lists`, 403, { name: 'No' });
    await expect(who, 'PATCH', base, 403, { name: 'No' });
    await expect(who, 'PUT', membership('member'), 403, { role: 'member' });
  }
  await expect('member', 'PATCH', base, 403, { name: 'No' });
  const list = await expect('member', 'POST', `${base}/lists`, 200, { name: 'List' });
  const card = await expect('member', 'POST', `/lists/${list.list.id}/cards`, 200, { title: 'Card' });
  const cardUrl = `/cards/${card.card.id}`;
  await expect('observer', 'GET', cardUrl, 200);
  await expect('observer', 'PATCH', cardUrl, 403, { title: 'No' });
  await expect('member', 'PATCH', cardUrl, 200, { title: 'Yes' });
  await expect('reader', 'POST', `${cardUrl}/comments`, 403, { content: 'No' });
  const comment = await expect('member', 'POST', `${cardUrl}/comments`, 200, { content: 'Yes' });
  await expect('observer', 'GET', `${cardUrl}/comments`, 200);
  await expect('observer', 'PATCH', `${cardUrl}/comments/${comment.comment.id}`, 403, { content: 'No' });
  await expect('member', 'PATCH', `${cardUrl}/comments/${comment.comment.id}`, 200, { content: 'Updated' });
  await expect('observer', 'DELETE', `${cardUrl}/comments/${comment.comment.id}`, 403);
  await expect('member', 'DELETE', `${cardUrl}/comments/${comment.comment.id}`, 200);
  await expect('boardadmin', 'PATCH', base, 200, { name: 'Updated' });
  await expect('member', 'DELETE', membership('observer'), 403);
  await expect('boardadmin', 'DELETE', membership('observer'), 200);
  await expect('orgadmin', 'DELETE', base, 403);
  await expect('boardadmin', 'DELETE', base, 200);
  const other = await expect('orgadmin', 'POST', `${orgUrl}/boards`, 200, { name: 'Other board' });
  await expect('owner', 'DELETE', `/boards/${other.board.id}`, 200);
});
