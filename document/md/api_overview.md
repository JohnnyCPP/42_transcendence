## API Overview

Protected routes use the session cookie configured by `SESSION_COOKIE_NAME`.

### Health and users

```http
GET /health
GET /me
GET /admin/users
```

`GET /admin/users` requires the global `admin` role.

### Authentication

```http
POST /auth/register
POST /auth/login
POST /auth/login/2fa
POST /auth/logout
POST /auth/reauthenticate
POST /auth/password/change
```

New passwords must contain between 12 and 128 characters. Password changes require a recent reauthentication and revoke the user's other active sessions.

### Two-factor authentication

```http
POST   /2fa/setup
POST   /2fa/confirm
POST   /2fa/recovery-codes/regenerate
DELETE /2fa
```

These operations require authentication and recent reauthentication.

### Organizations

```http
POST  /organizations
GET   /organizations
GET   /organizations/:organizationId
PATCH /organizations/:organizationId
PUT   /organizations/:organizationId/members/:userId
```

Only organization owners and administrators can edit an organization. Only an owner can promote, demote, or replace organization administrators.

### Boards

```http
POST  /organizations/:organizationId/boards
GET   /organizations/:organizationId/boards
GET   /boards/:boardId
PATCH /boards/:boardId
PUT   /boards/:boardId/members/:userId
```

Board roles are `admin`, `member`, and `observer`. Observers have read-only access.

### Lists

```http
POST  /boards/:boardId/lists
GET   /boards/:boardId/lists
PATCH /lists/:listId
POST  /boards/:boardId/lists/reorder
```

List reordering must include every active list ID exactly once.

### Cards

```http
POST   /lists/:listId/cards
GET    /lists/:listId/cards
GET    /cards/:cardId
PATCH  /cards/:cardId
POST   /cards/:cardId/move
DELETE /cards/:cardId
```

Moving a card places it at the end of the destination list. Deleting a card performs a soft deletion.

### Pagination

Collection routes accept:

```text
?limit=50&offset=0
```

`limit` must be between 1 and 100. Paginated responses include `limit`, `offset`, `total`, and `hasMore`.

