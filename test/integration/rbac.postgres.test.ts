// Story 11.7: exercise only RBAC through the real API and PostgreSQL.
import { beforeAll, afterAll, it } from 'vitest';
import { expect } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { ScryptPasswordHasher } from '/app/dist/shared/crypto/passwordHasher.js';

// Refuse to run against any database other than the disposable Compose fixture.
const url = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL) : null;
if (process.env.RBAC_INTEGRATION !== 'isolated' || url?.hostname !== 'postgres' || url.pathname !== '/rbac_integration')
  throw new Error('RBAC integration tests require the isolated Compose database');

const prisma = new PrismaClient();
const password = 'LocalIntegrationOnly123!';
const users = {};

async function call(actor, method, path, body) {
  const response = await fetch(`http://backend:3000/api/v1${path}`, {
    method,
    headers: { ...(actor ? { cookie: users[actor].cookie } : {}), ...(body ? { 'content-type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
}

async function expectResponse(actor, method, path, status, body) {
  const result = await call(actor, method, path, body);
  expect(result.status, `${actor} ${method} ${path}: ${JSON.stringify(result.body)}`).toBe(status);
  return result.body;
}

// Seed users with global roles and authenticate through the running API.
beforeAll(async () => {
  const passwordHash = await new ScryptPasswordHasher().hash(password);
  const roles = { admina: 'admin', adminb: 'admin', moderator: 'moderator', owner: 'user', orgadmin: 'user',
    boardadmin: 'user', member: 'user', observer: 'user', reader: 'user', outsider: 'user', target: 'user' };
  for (const [name, role] of Object.entries(roles)) {
    const user = await prisma.user.create({ data: { id: `rbac-${name}`, username: `rbac_${name}`, role,
      passwordCredential: { create: { passwordHash, passwordUpdatedAt: new Date() } } } });
    const login = await call(null, 'POST', '/login', { username: user.username, password });
    expect(login.status, `login ${name}`).toBe(200);
    expect(login.cookie, `session cookie for ${name}`).toBeTruthy();
    users[name] = { id: user.id, cookie: login.cookie };
  }
});
afterAll(async () => { await prisma.$disconnect(); });

// Exercise organization membership and access through HTTP and real persistence.
it('organization roles: reading, invitations, management and archiving', async () => {
  const created = await expectResponse('owner', 'POST', '/organizations', 200, { name: 'RBAC organization' });
  const org = `/organizations/${created.organization.id}`;
  const membership = name => `${org}/members/${users[name].id}`;
  await expectResponse('owner', 'PUT', membership('orgadmin'), 200, { role: 'admin' });
  await expectResponse('owner', 'PUT', membership('member'), 200, { role: 'member' });
  await expectResponse('orgadmin', 'PUT', membership('target'), 200, { role: 'member' });
  // Members can read the organization; outsiders cannot discover it.
  for (const actor of ['owner', 'orgadmin', 'member']) {
    await expectResponse(actor, 'GET', org, 200);
    await expectResponse(actor, 'GET', `${org}/boards`, 200);
    await expectResponse(actor, 'GET', `${org}/members`, 200);
  }
  await expectResponse('outsider', 'GET', org, 404);
  await expectResponse('outsider', 'GET', `${org}/members`, 404);
  await expectResponse('member', 'PATCH', org, 403, { name: 'Forbidden' });
  await expectResponse('orgadmin', 'PATCH', org, 200, { name: 'Updated' });
  await expectResponse('member', 'POST', `${org}/boards`, 403, { name: 'Forbidden' });
  await expectResponse('orgadmin', 'POST', `${org}/boards`, 200, { name: 'Allowed' });
  // Check membership management and prevent demotion or removal of the owner.
  await expectResponse('member', 'PUT', membership('target'), 403, { role: 'member' });
  await expectResponse('orgadmin', 'PUT', membership('target'), 403, { role: 'admin' });
  await expectResponse('owner', 'PUT', membership('owner'), 403, { role: 'member' });
  await expectResponse('owner', 'PUT', membership('target'), 200, { role: 'admin' });
  await expectResponse('orgadmin', 'DELETE', membership('target'), 403);
  await expectResponse('owner', 'PUT', membership('target'), 200, { role: 'member' });
  await expectResponse('member', 'DELETE', membership('target'), 403);
  await expectResponse('orgadmin', 'DELETE', membership('owner'), 403);
  await expectResponse('orgadmin', 'DELETE', membership('target'), 200);
  await expectResponse('owner', 'DELETE', membership('orgadmin'), 200);
  await expectResponse('member', 'DELETE', org, 403);
  await expectResponse('owner', 'DELETE', org, 200);
  await expectResponse('owner', 'GET', org, 404);
});

// Board permissions are checked independently of organization membership.
it('board roles: read, write, comments, memberships and archiving', async () => {
  const createdOrg = await expectResponse('owner', 'POST', '/organizations', 200, { name: 'RBAC boards' });
  const org = `/organizations/${createdOrg.organization.id}`;
  for (const name of ['orgadmin', 'boardadmin', 'member', 'observer', 'reader'])
    await expectResponse('owner', 'PUT', `${org}/members/${users[name].id}`, 200, { role: name === 'orgadmin' ? 'admin' : 'member' });
  const created = await expectResponse('owner', 'POST', `${org}/boards`, 200, { name: 'RBAC board' });
  const boardId = created.board.id;
  const board = `/boards/${boardId}`;
  const membership = name => `${board}/members/${users[name].id}`;
  await expectResponse('member', 'POST', `${board}/lists`, 200, { name: 'Allowed by main' });
  await expectResponse('outsider', 'GET', board, 404);
  for (const [name, role] of [['boardadmin', 'admin'], ['member', 'member'], ['observer', 'observer']])
    await expectResponse('orgadmin', 'PUT', membership(name), 200, { role });
  expect((await expectResponse('owner', 'GET', `${board}/access`, 200)).access)
    .toEqual({ organizationRole: 'owner', boardRole: 'admin', canWrite: true, canArchive: true });
  expect((await expectResponse('observer', 'GET', `${board}/access`, 200)).access)
    .toEqual({ organizationRole: 'member', boardRole: 'observer', canWrite: false, canArchive: false });
  await expectResponse('outsider', 'GET', `${board}/access`, 404);
  for (const actor of ['owner', 'orgadmin', 'boardadmin', 'member', 'observer', 'reader']) {
    await expectResponse(actor, 'GET', board, 200);
    await expectResponse(actor, 'GET', `${board}/lists`, 200);
  }
  // Read-only roles cannot change the board or its memberships.
  await expectResponse('reader', 'POST', `${board}/lists`, 200, { name: 'Allowed by main' });
  await expectResponse('observer', 'POST', `${board}/lists`, 403, { name: 'Forbidden' });
  for (const actor of ['observer', 'reader']) {
    await expectResponse(actor, 'PATCH', board, 403, { name: 'Forbidden' });
    await expectResponse(actor, 'PUT', membership('member'), 403, { role: 'member' });
  }
  await expectResponse('member', 'PATCH', board, 403, { name: 'Forbidden' });
  await expectResponse('boardadmin', 'PATCH', board, 200, { name: 'Updated' });
  await expectResponse('boardadmin', 'PUT', membership('reader'), 200, { role: 'observer' });
  await expectResponse('boardadmin', 'DELETE', membership('reader'), 200);
  const list = (await expectResponse('member', 'POST', `${board}/lists`, 200, { name: 'List' })).list;
  const listIds = (await expectResponse('member', 'GET', `${board}/lists`, 200)).lists.map(item => item.id);
  await expectResponse('observer', 'PATCH', `/lists/${list.id}`, 403, { name: 'Forbidden' });
  await expectResponse('member', 'PATCH', `/lists/${list.id}`, 200, { name: 'Updated list' });
  await expectResponse('observer', 'POST', `${board}/lists/reorder`, 403, { listIds });
  await expectResponse('member', 'POST', `${board}/lists/reorder`, 200, { listIds });
  // Cards default to Low; chosen and updated priorities must persist in PostgreSQL.
  const card = (await expectResponse('member', 'POST', `/lists/${list.id}/cards`, 200, { title: 'Card' })).card;
  expect(card.priority).toBe('Low');
  const urgentCard = (await expectResponse('member', 'POST', `/lists/${list.id}/cards`, 200, { title: 'Urgent card', priority: 'Urgent' })).card;
  expect((await prisma.card.findUniqueOrThrow({ where: { id: urgentCard.id } })).priority).toBe('Urgent');
  const priorityUpdate = await expectResponse('member', 'PATCH', `/cards/${card.id}`, 200, { priority: 'Urgent' });
  expect(priorityUpdate.card.priority).toBe('Urgent');
  expect((await expectResponse('observer', 'GET', `/cards/${card.id}`, 200)).card.priority).toBe('Urgent');
  expect((await prisma.card.findUniqueOrThrow({ where: { id: card.id } })).priority).toBe('Urgent');
  // Compare read/write permissions for cards, moves and comments.
  const cardUrl = `/cards/${card.id}`;
  await expectResponse('observer', 'GET', cardUrl, 200);
  await expectResponse('observer', 'PATCH', cardUrl, 403, { title: 'Forbidden' });
  await expectResponse('member', 'PATCH', cardUrl, 200, { title: 'Updated' });
  await expectResponse('observer', 'DELETE', cardUrl, 403);
  await expectResponse('observer', 'POST', `${cardUrl}/move`, 403, { targetListId: list.id });
  await expectResponse('observer', 'POST', `${cardUrl}/comments`, 403, { content: 'Forbidden' });
  const comment = (await expectResponse('member', 'POST', `${cardUrl}/comments`, 200, { content: 'Comment' })).comment;
  await expectResponse('observer', 'GET', `${cardUrl}/comments`, 200);
  await expectResponse('observer', 'PATCH', `${cardUrl}/comments/${comment.id}`, 403, { content: 'Forbidden' });
  await expectResponse('member', 'PATCH', `${cardUrl}/comments/${comment.id}`, 200, { content: 'Updated' });
  await expectResponse('observer', 'DELETE', `${cardUrl}/comments/${comment.id}`, 403);
  await expectResponse('member', 'DELETE', `${cardUrl}/comments/${comment.id}`, 200);
  await expectResponse('member', 'DELETE', cardUrl, 200);
  await expectResponse('member', 'DELETE', membership('observer'), 403);
  await expectResponse('boardadmin', 'DELETE', membership('member'), 200);
  await expectResponse('member', 'POST', `/lists/${list.id}/cards`, 200, { title: 'Allowed by main' });
  await expectResponse('owner', 'PUT', membership('member'), 200, { role: 'member' });
  // Removing an organization member also removes stale board membership.
  await expectResponse('orgadmin', 'DELETE', `${org}/members/${users.member.id}`, 200);
  await expectResponse('orgadmin', 'PUT', `${org}/members/${users.member.id}`, 200, { role: 'member' });
  await expectResponse('member', 'POST', `${board}/lists`, 200, { name: 'Organization member access' });
  expect(await prisma.boardMember.count({ where: { boardId, userId: users.member.id } })).toBe(0);
  await expectResponse('member', 'DELETE', board, 403);
  await expectResponse('boardadmin', 'DELETE', board, 200);
  const other = (await expectResponse('orgadmin', 'POST', `${org}/boards`, 200, { name: 'Other' })).board;
  await expectResponse('owner', 'DELETE', `/boards/${other.id}`, 200);
});

// Verify user administration and the last-admin rule against the real database.
it('global roles: safe user administration and concurrent last-admin protection', async () => {
  const target = `/users/${users.target.id}`;
  for (const actor of ['reader', 'moderator', 'admina']) await expectResponse(actor, 'GET', '/me', 200);
  for (const actor of ['moderator', 'admina']) {
    await expectResponse(actor, 'GET', '/users?role=user&status=active', 200);
    const result = await expectResponse(actor, 'GET', target, 200);
    for (const secret of ['passwordHash', 'secretEncrypted', 'codeHash']) expect(secret in result.user).toBe(false);
  }
  await expectResponse('reader', 'GET', '/users', 403);
  await expectResponse('reader', 'GET', target, 403);
  await expectResponse('moderator', 'PATCH', target, 403, { displayName: 'Forbidden' });
  await expectResponse('moderator', 'DELETE', target, 403);
  await expectResponse('moderator', 'GET', '/admin-users', 403);
  await expectResponse('admina', 'GET', '/admin-users', 200);
  await expectResponse('admina', 'PATCH', `/users/${users.admina.id}`, 403, { role: 'user' });
  await expectResponse('admina', 'PATCH', `/users/${users.admina.id}`, 403, { status: 'disabled' });
  await expectResponse('admina', 'DELETE', `/users/${users.admina.id}`, 403);
  await expectResponse('moderator', 'DELETE', `/users/${users.moderator.id}`, 403);
  await expectResponse('admina', 'PATCH', target, 400, { role: 'invalid' });
  await expectResponse('admina', 'PATCH', target, 200, { displayName: 'Updated', status: 'disabled' });
  const disabled = await expectResponse('moderator', 'GET', '/users?status=disabled', 200);
  expect(disabled.users.some(user => user.id === users.target.id)).toBeTruthy();
  await expectResponse('admina', 'DELETE', target, 200);
  const list = await expectResponse('admina', 'GET', '/users', 200);
  expect(list.users.some(user => user.id === users.target.id)).toBe(false);
  expect((await prisma.user.findUnique({ where: { id: users.target.id } })).status).toBe('deleted');
  // Concurrent demotions must leave exactly one active administrator.
  const results = await Promise.all([
    call('admina', 'PATCH', `/users/${users.adminb.id}`, { role: 'user' }),
    call('adminb', 'PATCH', `/users/${users.admina.id}`, { role: 'user' })
  ]);
  expect(results.filter(result => result.status === 200).length).toBe(1);
  expect(results.some(result => [403, 409].includes(result.status))).toBeTruthy();
  expect(await prisma.user.count({ where: { role: 'admin', status: 'active' } })).toBe(1);
});
