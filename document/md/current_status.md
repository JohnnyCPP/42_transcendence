## Current Project Status

### Implemented

- User registration with a username, optional email, and password.
- Login, logout, persistent sessions, expiration, and session revocation.
- Password hashing with Node.js `scrypt` and per-password random salts.
- Session tokens and recovery codes stored as hashes rather than plaintext.
- Recent reauthentication for sensitive operations.
- TOTP two-factor authentication, one-time recovery codes, regeneration, and removal.
- Organization creation, listing, retrieval, and editing.
- Organization membership roles: `owner`, `admin`, and `member`.
- Board creation, listing, retrieval, and editing.
- Board membership roles: `admin`, `member`, and read-only `observer`.
- List creation, listing, renaming, and full-board reordering.
- Card creation, listing, retrieval, editing, movement between lists, and soft deletion.
- Offset-based pagination for users, organizations, boards, lists, and cards.
- Request validation with Zod and typed Fastify routes.
- PostgreSQL persistence through Prisma.
- Prisma Migrate history stored under `prisma/migrations`.
- In-memory repository implementations used when `NODE_ENV=test`.
- A responsive manual interface for exercising the main API flows.

### Present in the database model but not implemented as application features

The Prisma schema and the initial Prisma migration already contain tables for:

- Card assignees.
- Comments.
- Labels.
- Card-label relationships.

These entities do not yet have services, HTTP routes, or interface controls.

### Not implemented yet

- A production frontend framework and final user-facing interface.
- Drag-and-drop interaction.
- Arbitrary card ordering within a list.
- Organization, board, and list deletion or archival endpoints.
- Member listing and member removal flows.
- User profile editing, avatars, friends, and online presence.
- Real-time updates or WebSockets.
- Notifications.
- Internationalization.
- Prometheus/Grafana monitoring.
- WAF/ModSecurity and HashiCorp Vault.
- Application-level HTTPS configuration.
- Privacy Policy and Terms of Service pages.
- Containerization of the complete application; Docker Compose currently starts PostgreSQL only.
- An automated test suite in this checkout.
