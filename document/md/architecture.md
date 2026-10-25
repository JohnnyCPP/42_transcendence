## Architecture

The backend is organized by domain modules:

```text
src/
|-- app.ts                  Fastify construction and dependency wiring
|-- server.ts               HTTP server entry point
|-- config/                 Environment and security configuration
|-- db/                     Prisma client setup
|-- modules/
|   |-- auth/               Registration, login, reauthentication, passwords
|   |-- authorization/      Authentication and global-role guards
|   |-- boards/             Boards and board-level roles
|   |-- cards/              Card CRUD, movement, and archival
|   |-- lists/              Board lists and list reordering
|   |-- organizations/      Organizations and memberships
|   |-- sessions/           Persistent sessions
|   |-- two_factor/         TOTP and recovery codes
|   `-- users/              Current user and administrative user listing
|-- shared/                 Cryptography, errors, cookies, pagination, rate limits
`-- ui/                     Routes that serve the manual browser interface

public/                     Manual HTML/CSS/JavaScript interface
prisma/schema.prisma        Prisma data model
prisma/migrations/          Prisma migration history
```

Most domain modules use the following dependency flow:

```text
HTTP route -> service -> repository interface -> Prisma or in-memory repository
```

Routes validate transport data and require authentication where appropriate. Services enforce permissions and business rules. Repositories handle storage.

