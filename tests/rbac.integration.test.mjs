// Story 11.7: exercise only RBAC through the real API and PostgreSQL.
import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import { ScryptPasswordHasher } from '../dist/shared/crypto/passwordHasher.js';

const url = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL) : null;
if (process.env.RBAC_INTEGRATION !== 'isolated' || url?.hostname !== 'postgres' || url.pathname !== '/rbac_integration')
  throw new Error('RBAC integration tests require the isolated Compose database');

const prisma = new PrismaClient();
const password = 'LocalIntegrationOnly123!';
const users = {};

async function call(actor, method, path, body) {
  const response = await fetch(`http://backend:3000${path}`, {
    method,
    headers: { ...(actor ? { cookie: users[actor].cookie } : {}), ...(body ? { 'content-type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
}

async function expect(actor, method, path, status, body) {
  const result = await call(actor, method, path, body);
  assert.equal(result.status, status, `${actor} ${method} ${path}: ${JSON.stringify(result.body)}`);
  return result.body;
}

before(async () => {
  const passwordHash = await new ScryptPasswordHasher().hash(password);
  const roles = { admina: 'admin', adminb: 'admin', moderator: 'moderator', owner: 'user', orgadmin: 'user',
    boardadmin: 'user', member: 'user', observer: 'user', reader: 'user', outsider: 'user', target: 'user' };
  for (const [name, role] of Object.entries(roles)) {
    const user = await prisma.user.create({ data: { id: `rbac-${name}`, username: `rbac_${name}`, role,
      passwordCredential: { create: { passwordHash, passwordUpdatedAt: new Date() } } } });
    const login = await call(null, 'POST', '/auth/login', { username: user.username, password });
    assert.equal(login.status, 200, `login ${name}`);
    assert.ok(login.cookie, `session cookie for ${name}`);
    users[name] = { id: user.id, cookie: login.cookie };
  }
});
after(async () => { await prisma.$disconnect(); });

test('organization roles: reading, invitations, management and archiving', async () => {
  const created = await expect('owner', 'POST', '/organizations', 200, { name: 'RBAC organization' });
  const org = `/organizations/${created.organization.id}`;
  const membership = name => `${org}/members/${users[name].id}`;
  await expect('owner', 'PUT', membership('orgadmin'), 200, { role: 'admin' });
  await expect('owner', 'PUT', membership('member'), 200, { role: 'member' });
  await expect('orgadmin', 'PUT', membership('target'), 200, { role: 'member' });
  for (const actor of ['owner', 'orgadmin', 'member']) {
    await expect(actor, 'GET', org, 200);
    await expect(actor, 'GET', `${org}/boards`, 200);
    await expect(actor, 'GET', `${org}/members`, 200);
  }
  await expect('outsider', 'GET', org, 404);
  await expect('outsider', 'GET', `${org}/members`, 404);
  await expect('member', 'PATCH', org, 403, { name: 'Forbidden' });
  await expect('orgadmin', 'PATCH', org, 200, { name: 'Updated' });
  await expect('member', 'POST', `${org}/boards`, 403, { name: 'Forbidden' });
  await expect('orgadmin', 'POST', `${org}/boards`, 200, { name: 'Allowed' });
  await expect('member', 'PUT', membership('target'), 403, { role: 'member' });
  await expect('orgadmin', 'PUT', membership('target'), 403, { role: 'admin' });
  await expect('owner', 'PUT', membership('owner'), 403, { role: 'member' });
  await expect('owner', 'PUT', membership('target'), 200, { role: 'admin' });
  await expect('orgadmin', 'DELETE', membership('target'), 403);
  await expect('owner', 'PUT', membership('target'), 200, { role: 'member' });
  await expect('member', 'DELETE', membership('target'), 403);
  await expect('orgadmin', 'DELETE', membership('owner'), 403);
  await expect('orgadmin', 'DELETE', membership('target'), 200);
  await expect('owner', 'DELETE', membership('orgadmin'), 200);
  await expect('member', 'DELETE', org, 403);
  await expect('owner', 'DELETE', org, 200);
  await expect('owner', 'GET', org, 404);
});

test('board roles: read, write, comments, memberships and archiving', async () => {
  const createdOrg = await expect('owner', 'POST', '/organizations', 200, { name: 'RBAC boards' });
  const org = `/organizations/${createdOrg.organization.id}`;
  for (const name of ['orgadmin', 'boardadmin', 'member', 'observer', 'reader'])
    await expect('owner', 'PUT', `${org}/members/${users[name].id}`, 200, { role: name === 'orgadmin' ? 'admin' : 'member' });
  const created = await expect('owner', 'POST', `${org}/boards`, 200, { name: 'RBAC board' });
  const boardId = created.board.id;
  const board = `/boards/${boardId}`;
  const membership = name => `${board}/members/${users[name].id}`;
  await expect('member', 'POST', `${board}/lists`, 403, { name: 'Forbidden' });
  await expect('outsider', 'GET', board, 404);
  for (const [name, role] of [['boardadmin', 'admin'], ['member', 'member'], ['observer', 'observer']])
    await expect('orgadmin', 'PUT', membership(name), 200, { role });
  for (const actor of ['owner', 'orgadmin', 'boardadmin', 'member', 'observer', 'reader']) {
    await expect(actor, 'GET', board, 200);
    await expect(actor, 'GET', `${board}/lists`, 200);
  }
  for (const actor of ['observer', 'reader']) {
    await expect(actor, 'POST', `${board}/lists`, 403, { name: 'Forbidden' });
    await expect(actor, 'PATCH', board, 403, { name: 'Forbidden' });
    await expect(actor, 'PUT', membership('member'), 403, { role: 'member' });
  }
  await expect('member', 'PATCH', board, 403, { name: 'Forbidden' });
  await expect('boardadmin', 'PATCH', board, 200, { name: 'Updated' });
  await expect('boardadmin', 'PUT', membership('reader'), 200, { role: 'observer' });
  await expect('boardadmin', 'DELETE', membership('reader'), 200);
  const list = (await expect('member', 'POST', `${board}/lists`, 200, { name: 'List' })).list;
  await expect('observer', 'PATCH', `/lists/${list.id}`, 403, { name: 'Forbidden' });
  await expect('member', 'PATCH', `/lists/${list.id}`, 200, { name: 'Updated list' });
  await expect('observer', 'POST', `${board}/lists/reorder`, 403, { listIds: [list.id] });
  await expect('member', 'POST', `${board}/lists/reorder`, 200, { listIds: [list.id] });
  const card = (await expect('member', 'POST', `/lists/${list.id}/cards`, 200, { title: 'Card' })).card;
  const cardUrl = `/cards/${card.id}`;
  await expect('observer', 'GET', cardUrl, 200);
  await expect('observer', 'PATCH', cardUrl, 403, { title: 'Forbidden' });
  await expect('member', 'PATCH', cardUrl, 200, { title: 'Updated' });
  await expect('observer', 'DELETE', cardUrl, 403);
  await expect('observer', 'POST', `${cardUrl}/move`, 403, { targetListId: list.id });
  await expect('reader', 'POST', `${cardUrl}/comments`, 403, { content: 'Forbidden' });
  const comment = (await expect('member', 'POST', `${cardUrl}/comments`, 200, { content: 'Comment' })).comment;
  await expect('observer', 'GET', `${cardUrl}/comments`, 200);
  await expect('observer', 'PATCH', `${cardUrl}/comments/${comment.id}`, 403, { content: 'Forbidden' });
  await expect('member', 'PATCH', `${cardUrl}/comments/${comment.id}`, 200, { content: 'Updated' });
  await expect('observer', 'DELETE', `${cardUrl}/comments/${comment.id}`, 403);
  await expect('member', 'DELETE', `${cardUrl}/comments/${comment.id}`, 200);
  await expect('member', 'DELETE', cardUrl, 200);
  await expect('member', 'DELETE', membership('observer'), 403);
  await expect('boardadmin', 'DELETE', membership('member'), 200);
  await expect('member', 'POST', `/lists/${list.id}/cards`, 403, { title: 'Forbidden' });
  await expect('owner', 'PUT', membership('member'), 200, { role: 'member' });
  await expect('orgadmin', 'DELETE', `${org}/members/${users.member.id}`, 200);
  await expect('orgadmin', 'PUT', `${org}/members/${users.member.id}`, 200, { role: 'member' });
  await expect('member', 'POST', `${board}/lists`, 403, { name: 'No stale access' });
  assert.equal(await prisma.boardMember.count({ where: { boardId, userId: users.member.id } }), 0);
  await expect('orgadmin', 'DELETE', board, 403);
  await expect('member', 'DELETE', board, 403);
  await expect('boardadmin', 'DELETE', board, 200);
  const other = (await expect('orgadmin', 'POST', `${org}/boards`, 200, { name: 'Other' })).board;
  await expect('owner', 'DELETE', `/boards/${other.id}`, 200);
});

test('global roles: safe user administration and concurrent last-admin protection', async () => {
  const target = `/users/${users.target.id}`;
  for (const actor of ['reader', 'moderator', 'admina']) await expect(actor, 'GET', '/me', 200);
  for (const actor of ['moderator', 'admina']) {
    await expect(actor, 'GET', '/users?role=user&status=active', 200);
    const result = await expect(actor, 'GET', target, 200);
    for (const secret of ['passwordHash', 'secretEncrypted', 'codeHash']) assert.equal(secret in result.user, false);
  }
  await expect('reader', 'GET', '/users', 403);
  await expect('reader', 'GET', target, 403);
  await expect('moderator', 'PATCH', target, 403, { displayName: 'Forbidden' });
  await expect('moderator', 'DELETE', target, 403);
  await expect('moderator', 'GET', '/admin/users', 403);
  await expect('admina', 'GET', '/admin/users', 200);
  await expect('admina', 'PATCH', `/users/${users.admina.id}`, 403, { role: 'user' });
  await expect('admina', 'PATCH', `/users/${users.admina.id}`, 403, { status: 'disabled' });
  await expect('admina', 'DELETE', `/users/${users.admina.id}`, 403);
  await expect('moderator', 'DELETE', `/users/${users.moderator.id}`, 403);
  await expect('admina', 'PATCH', target, 400, { role: 'invalid' });
  await expect('admina', 'PATCH', target, 200, { displayName: 'Updated', status: 'disabled' });
  const disabled = await expect('moderator', 'GET', '/users?status=disabled', 200);
  assert.ok(disabled.users.some(user => user.id === users.target.id));
  await expect('admina', 'DELETE', target, 200);
  const list = await expect('admina', 'GET', '/users', 200);
  assert.equal(list.users.some(user => user.id === users.target.id), false);
  assert.equal((await prisma.user.findUnique({ where: { id: users.target.id } })).status, 'deleted');
  const results = await Promise.all([
    call('admina', 'PATCH', `/users/${users.adminb.id}`, { role: 'user' }),
    call('adminb', 'PATCH', `/users/${users.admina.id}`, { role: 'user' })
  ]);
  assert.equal(results.filter(result => result.status === 200).length, 1);
  assert.ok(results.some(result => [403, 409].includes(result.status)));
  assert.equal(await prisma.user.count({ where: { role: 'admin', status: 'active' } }), 1);
});
