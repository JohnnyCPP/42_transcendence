// Story 11.7: authorization rules for global, organization and board roles.
import { it, onTestFinished } from 'vitest';
import { expect as vitestExpect } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.SESSION_COOKIE_NAME = 'rbac_test_sid';
process.env.TOTP_ENCRYPTION_KEY_BASE64 = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
const { buildApp } = await import('../../src/app.js');

// Create isolated users and sessions; requests exercise routes with in-memory repositories.
async function fixture(names) {
  const app = await buildApp();
  const accounts = {};
  for (const name of names) {
    const user = await app.testContext.usersService.createUser({ username: `rbac-${name}` });
    const session = await app.testContext.sessionsService.createSession({ userId: user.id });
    accounts[name] = { user, cookie: `rbac_test_sid=${session.token}` };
  }
  const call = async (who, method, url, payload) => {
    const response = await app.inject({ method, url: `/api/v1${url}`, headers: { cookie: accounts[who].cookie }, ...(payload === undefined ? {} : { payload }) });
    return { status: response.statusCode, body: response.json() };
  };
  // Include actor and route in failures so permission regressions are easy to locate.
  const expect = async (who, method, url, status, payload) => {
    const result = await call(who, method, url, payload);
    vitestExpect(result.status, `${who} ${method} ${url}: ${JSON.stringify(result.body)}`).toBe(status);
    return result.body;
  };
  return { app, accounts, expect, call };
}

it('global roles: user management and last administrator', async () => {
  const { app, accounts: a, expect } = await fixture(['admin', 'admin2', 'moderator', 'user', 'target']);
  onTestFinished(() => app.close());
  const service = app.testContext.usersService;
  await service.updateManagedUser('fixture', a.admin.user.id, { role: 'admin' });
  await service.updateManagedUser('fixture', a.admin2.user.id, { role: 'admin' });
  await service.updateManagedUser('fixture', a.moderator.user.id, { role: 'moderator' });
  const id = a.target.user.id;
  // All users can inspect their own session; only moderators and admins can read users.
  for (const actor of ['user', 'moderator', 'admin']) await expect(actor, 'GET', '/me', 200);
  for (const actor of ['moderator', 'admin']) {
    await expect(actor, 'GET', '/users?role=user&status=active', 200);
    const result = await expect(actor, 'GET', `/users/${id}`, 200);
    vitestExpect('passwordHash' in result.user).toBe(false);
    vitestExpect('secretEncrypted' in result.user).toBe(false);
  }
  for (const method of ['GET', 'PATCH', 'DELETE']) await expect('user', method, method === 'GET' ? '/users' : `/users/${id}`, 403, method === 'PATCH' ? { displayName: 'No' } : undefined);
  await expect('moderator', 'GET', '/admin-users', 403);
  await expect('admin', 'GET', '/admin-users', 200);
  await expect('moderator', 'PATCH', `/users/${id}`, 403, { displayName: 'No' });
  await expect('moderator', 'DELETE', `/users/${id}`, 403);
  // Administrators cannot remove their own privileged access through these routes.
  await expect('admin', 'PATCH', `/users/${a.admin.user.id}`, 403, { role: 'user' });
  await expect('admin', 'PATCH', `/users/${a.admin.user.id}`, 403, { status: 'disabled' });
  await expect('admin', 'DELETE', `/users/${a.admin.user.id}`, 403);
  await expect('admin', 'PATCH', `/users/${id}`, 200, { displayName: 'Updated', status: 'disabled' });
  await expect('admin', 'DELETE', `/users/${id}`, 200);
  const page = await expect('admin', 'GET', '/users', 200);
  vitestExpect(page.users.some(user => user.id === id)).toBe(false);
  await expect('admin', 'GET', `/users/${id}`, 404);
  await expect('admin', 'PATCH', `/users/${a.admin2.user.id}`, 200, { role: 'user' });
  await expect('admin2', 'PATCH', `/users/${a.admin.user.id}`, 403, { role: 'user' });
  // The service also protects the final active administrator.
  await vitestExpect(service.updateManagedUser('fixture', a.admin.user.id, { role: 'user' })).rejects.toMatchObject({ code: 'LAST_ADMIN' });
});

it('organization roles: membership, settings, boards and archive', async () => {
  const { app, accounts: a, expect } = await fixture(['owner', 'admin', 'member', 'target', 'outsider']);
  onTestFinished(() => app.close());
  const org = await app.testContext.organizationsService.createOrganization({ name: 'RBAC organization', createdByUserId: a.owner.user.id });
  const base = `/organizations/${org.id}`;
  const membership = who => `${base}/members/${a[who].user.id}`;
  // Set up memberships before testing read, write and management permissions.
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
  // Only permitted roles can manage members; owner and admin privileges differ.
  await expect('member', 'PUT', membership('target'), 403, { role: 'member' });
  await expect('admin', 'PUT', membership('target'), 403, { role: 'admin' });
  await expect('owner', 'PUT', membership('target'), 200, { role: 'admin' });
  await expect('admin', 'DELETE', membership('target'), 403);
  await expect('owner', 'PUT', membership('target'), 200, { role: 'member' });
  await expect('member', 'DELETE', membership('target'), 403);
  await expect('admin', 'DELETE', membership('owner'), 403);
  await expect('admin', 'DELETE', membership('target'), 200);
  await expect('owner', 'DELETE', membership('admin'), 200);
  // Archiving is reserved for the owner and hides the organization afterwards.
  await expect('member', 'DELETE', base, 403);
  await expect('owner', 'DELETE', base, 200);
  await expect('owner', 'GET', base, 404);
});

it('adds organization members explicitly and protects membership operations', async () => {
  const { app, accounts: a, expect, call } = await fixture(['owner', 'admin', 'member', 'target', 'outsider']);
  onTestFinished(() => app.close());
  const org = await app.testContext.organizationsService.createOrganization({ name: 'Member API', createdByUserId: a.owner.user.id });
  const base = `/organizations/${org.id}/members`;
  await expect('owner', 'POST', base, 200, { username: a.admin.user.username, role: 'admin' });
  const added = await expect('admin', 'POST', base, 200, { username: a.member.user.username });
  vitestExpect(added.member.userId).toBe(a.member.user.id);
  await expect('owner', 'POST', base, 400, { userId: a.target.user.id });
  vitestExpect(added.member.role).toBe('member');
  await expect('member', 'POST', base, 403, { username: a.target.user.username });
  await expect('outsider', 'POST', base, 404, { username: a.target.user.username });
  await expect('admin', 'POST', base, 403, { username: a.target.user.username, role: 'admin' });
  await expect('owner', 'POST', base, 404, { username: 'missing-user' });
  const duplicate = await expect('owner', 'POST', base, 409, { username: a.member.user.username });
  vitestExpect(duplicate.error).toBe('ORGANIZATION_MEMBER_EXISTS');
  const results = await Promise.all([call('owner', 'POST', base, { username: a.target.user.username }), call('owner', 'POST', base, { username: a.target.user.username })]);
  vitestExpect(results.map(result => result.status).sort()).toEqual([200, 409]);
  const list = await expect('member', 'GET', base, 200);
  vitestExpect(list.members.map(member => member.userId)).toContain(a.target.user.id);
  const ownerRemoval = await expect('owner', 'DELETE', `${base}/${a.owner.user.id}`, 403);
  vitestExpect(ownerRemoval.error).toBe('ORGANIZATION_OWNER_IMMUTABLE');
  await expect('owner', 'PUT', `${base}/${a.owner.user.id}`, 403, { role: 'member' });
  await expect('owner', 'DELETE', `${base}/${a.target.user.id}`, 200);
  const missing = await expect('owner', 'DELETE', `${base}/${a.target.user.id}`, 404);
  vitestExpect(missing.error).toBe('ORGANIZATION_MEMBER_NOT_FOUND');
  vitestExpect((await app.inject({ method: 'POST', url: `/api/v1${base}`, payload: { username: a.target.user.username } })).statusCode).toBe(401);
});

it('requires authentication and organization membership for every scoped route', async () => {
  const { app, accounts: a, expect } = await fixture(['owner', 'member', 'outsider', 'target']);
  onTestFinished(() => app.close());
  const org = await app.testContext.organizationsService.createOrganization({ name: 'Scope guard', createdByUserId: a.owner.user.id });
  const base = `/organizations/${org.id}`;
  await expect('owner', 'POST', `${base}/members`, 200, { username: a.member.user.username });
  const cases = [
    ['GET', base],
    ['PATCH', base, { name: 'Changed' }],
    ['DELETE', base],
    ['GET', `${base}/members`],
    ['POST', `${base}/members`, { username: a.target.user.username }],
    ['PUT', `${base}/members/${a.target.user.id}`, { role: 'member' }],
    ['DELETE', `${base}/members/${a.target.user.id}`],
    ['GET', `${base}/boards`],
    ['POST', `${base}/boards`, { name: 'Board' }]
  ];
  for (const [method, path, payload] of cases) {
    const unauthenticated = await app.inject({ method, url: `/api/v1${path}`, ...(payload ? { payload } : {}) });
    vitestExpect(unauthenticated.statusCode, `${method} ${path}`).toBe(401);
    await expect('outsider', method, path, 404, payload);
  }
  for (const [method, path, payload] of cases.filter(([method]) => method !== 'GET'))
    await expect('member', method, path, 403, payload);
  for (const [method, path] of cases.filter(([method]) => method === 'GET'))
    await expect('member', method, path, 200);
});

it('board roles: read, writes, membership and archive', async () => {
  const { app, accounts: a, expect } = await fixture(['owner', 'orgadmin', 'boardadmin', 'member', 'observer', 'reader', 'outsider']);
  onTestFinished(() => app.close());
  const org = await app.testContext.organizationsService.createOrganization({ name: 'Board roles', createdByUserId: a.owner.user.id });
  const orgUrl = `/organizations/${org.id}`;
  for (const name of ['orgadmin', 'boardadmin', 'member', 'observer', 'reader'])
    await expect('owner', 'PUT', `${orgUrl}/members/${a[name].user.id}`, 200, { role: name === 'orgadmin' ? 'admin' : 'member' });
  const created = await expect('owner', 'POST', `${orgUrl}/boards`, 200, { name: 'Board' });
  const base = `/boards/${created.board.id}`;
  const membership = who => `${base}/members/${a[who].user.id}`;
  // Assign board roles separately from organization roles and compare access.
  for (const [name, role] of [['boardadmin', 'admin'], ['member', 'member'], ['observer', 'observer']])
    await expect('orgadmin', 'PUT', membership(name), 200, { role });
  for (const [who, organizationRole, boardRole, canWrite, canArchive] of [
    ['owner', 'owner', 'admin', true, true],
    ['orgadmin', 'admin', 'admin', true, true],
    ['boardadmin', 'member', 'admin', true, true],
    ['member', 'member', 'member', true, false],
    ['reader', 'member', 'member', true, false],
    ['observer', 'member', 'observer', false, false]
  ]) {
    const result = await expect(who, 'GET', `${base}/access`, 200);
    vitestExpect(result.access).toEqual({ organizationRole, boardRole, canWrite, canArchive });
  }
  await expect('outsider', 'GET', `${base}/access`, 404);
  vitestExpect((await app.inject({ method: 'GET', url: `/api/v1${base}/access` })).statusCode).toBe(401);
  for (const who of ['owner', 'orgadmin', 'boardadmin', 'member', 'observer', 'reader']) {
    await expect(who, 'GET', base, 200);
    await expect(who, 'GET', `${base}/lists`, 200);
  }
  await expect('outsider', 'GET', base, 404);
  await expect('reader', 'POST', `${base}/lists`, 200, { name: 'Allowed by main' });
  for (const who of ['reader', 'observer']) {
    await expect(who, 'PATCH', base, 403, { name: 'No' });
    await expect(who, 'PUT', membership('member'), 403, { role: 'member' });
  }
  await expect('observer', 'POST', `${base}/lists`, 403, { name: 'No' });
  await expect('member', 'PATCH', base, 403, { name: 'No' });
  // Members can write lists, cards and comments; observers cannot modify them.
  const list = await expect('member', 'POST', `${base}/lists`, 200, { name: 'List' });
  const card = await expect('member', 'POST', `/lists/${list.list.id}/cards`, 200, { title: 'Card' });
  const cardUrl = `/cards/${card.card.id}`;
  await expect('observer', 'GET', cardUrl, 200);
  await expect('observer', 'PATCH', cardUrl, 403, { title: 'No' });
  await expect('member', 'PATCH', cardUrl, 200, { title: 'Yes' });
  await expect('observer', 'POST', `${cardUrl}/comments`, 403, { content: 'No' });
  const comment = await expect('member', 'POST', `${cardUrl}/comments`, 200, { content: 'Yes' });
  await expect('observer', 'GET', `${cardUrl}/comments`, 200);
  await expect('observer', 'PATCH', `${cardUrl}/comments/${comment.comment.id}`, 403, { content: 'No' });
  await expect('member', 'PATCH', `${cardUrl}/comments/${comment.comment.id}`, 200, { content: 'Updated' });
  await expect('observer', 'DELETE', `${cardUrl}/comments/${comment.comment.id}`, 403);
  await expect('member', 'DELETE', `${cardUrl}/comments/${comment.comment.id}`, 200);
  await expect('boardadmin', 'PATCH', base, 200, { name: 'Updated' });
  // Membership management and board archiving require appropriate board privileges.
  await expect('member', 'DELETE', membership('observer'), 403);
  await expect('boardadmin', 'DELETE', membership('observer'), 200);
  await expect('boardadmin', 'DELETE', base, 200);
  const other = await expect('orgadmin', 'POST', `${orgUrl}/boards`, 200, { name: 'Other board' });
  await expect('owner', 'DELETE', `/boards/${other.board.id}`, 200);
});
