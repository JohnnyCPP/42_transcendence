*This project has been created as part of the 42 curriculum by pablgarc, jonnavar, gsoteldo, jorexpos, jdiaz-he.*

# TaskFlow

## Table of Contents

- Description
- Instructions
- Resources
- Team Information
- Project Management
- Technical Stack
- Database
- Features List
- Modules
- Individual Contributions

## Tree

Updated: 2026-10-22

```text
.
├── docker-compose.yml
├── document
│   ├── md
│   ├── pdf
│   └── png
├── package.json
├── package-lock.json
├── prisma
│   ├── migrations
│   └── schema.prisma
├── src
│   ├── app.ts
│   ├── config
│   ├── db
│   ├── modules
│   │   ├── auth
│   │   ├── authorization
│   │   ├── boards
│   │   ├── cards
│   │   ├── lists
│   │   ├── organizations
│   │   ├── sessions
│   │   ├── two_factor
│   │   └── users
│   ├── server.ts
│   └── shared
│       ├── crypto
│       ├── errors
│       └── http
└── tsconfig.json
```

## Description

**TODO:** Clearly presents the project, including its goal and a brief overview.

**TODO:** Should also contain a clear name for the project and its key features.

TaskFlow is a work-management web application inspired by Trello.

The implemented domain follows this hierarchy:

```text
Organization -> Board -> List -> Card
```

Users can authenticate, enable two-factor authentication, create shared organizations and boards, organize work into ordered lists, and create, edit, move, or archive cards.

## Instructions

The whole stack (PostgreSQL, Fastify backend and Next.js frontend) runs with Docker Compose. No Node.js or PostgreSQL installation is needed on the host.

```text
Browser --HTTPS:443--> nextjs (Next.js + TLS) --HTTP--> fastify (API) --TCP--> postgres
```

Only the `nextjs` container publishes a port (`443`). `fastify` and `postgres` are reachable only inside the Compose network, so every browser request goes through HTTPS.

### Prerequisites

- Docker Engine with the Compose plugin (`docker compose version` must work).
- OpenSSL, only to generate the TOTP key below.
- Port `443` free on the host.

### Quick start

1. Create your environment file from the example:

   ```bash
   cp .env.example .env
   ```

2. Replace `TOTP_ENCRYPTION_KEY_BASE64` in `.env` with a real key (32 random bytes, Base64):

   ```bash
   openssl rand -base64 32
   ```

3. Build and start everything:

   ```bash
   docker compose up --build
   ```

   Startup order is enforced by healthchecks: `postgres` becomes healthy, then `fastify` applies the Prisma migrations (`prisma migrate deploy`) and becomes healthy, then `nextjs` starts.

4. Open the application:

   ```text
   https://localhost/
   ```

   The certificate is self-signed, so the browser shows a security warning the first time. Accept it, or trust the certificate as described below.

### Stopping and resetting

| Command | Effect |
| --- | --- |
| `docker compose down` | Stops and removes the containers; database data is kept |
| `docker compose down -v` | Also deletes the `postgres_data` volume (empty database on next start) |
| `docker compose ps` | Shows each service and its health |
| `docker compose logs -f fastify` | Follows the logs of one service |

### Environment variables used by Compose

Compose reads `${VAR}` values from the root `.env` file.

| Variable | Used by | Notes |
| --- | --- | --- |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | postgres, fastify | Database credentials; `fastify` builds its `DATABASE_URL` from them, pointing to the `postgres` service |
| `TOTP_ENCRYPTION_KEY_BASE64` | fastify | Required; 32 random bytes in Base64 |
| `SESSION_COOKIE_NAME`, `SESSION_TTL_DAYS`, `TOTP_ISSUER` | fastify | Optional; defaults `sid`, `14`, `Transcendence` |

Fixed values are set by the images or by `docker-compose.yml`: `NODE_ENV=production`, `HOST=0.0.0.0`, `PORT=3000`, `COOKIE_SECURE=true`, `INTERNAL_API_URL=http://fastify:3000` (build-time and runtime, used by the Next.js rewrites), `HTTPS_CERT_PATH` and `HTTPS_KEY_PATH`.

### HTTPS and the self-signed certificate

- `frontend/server.mjs` is a small Node.js HTTPS server that wraps Next.js, because `next start` cannot serve HTTPS.
- `frontend/scripts/generate-cert.sh` creates the certificate with OpenSSL while the image is built (valid for `localhost` and `127.0.0.1`, 365 days). It is never committed.
- `frontend/next.config.ts` proxies every `/api/*` request to Fastify without changing the path, so the browser only talks to `https://localhost`.

#### How to trust the certificate locally

The warning is expected and safe to accept for local evaluation. To remove it, export the certificate and add it as a trusted authority:

```bash
docker compose cp nextjs:/app/certs/cert.pem ./localhost-cert.pem
```

- **Windows:** double-click `localhost-cert.pem` (rename it to `.crt` if needed), choose *Install Certificate*, *Local Machine*, and place it in *Trusted Root Certification Authorities*.
- **macOS:** open it with *Keychain Access*, add it to the *System* keychain and set *Always Trust*.
- **Linux (Chrome):** `chrome://settings/certificates`, *Authorities*, *Import*.
- **Firefox (any OS):** *Settings*, *Privacy & Security*, *View Certificates*, *Authorities*, *Import*.

A new certificate is generated every time the `nextjs` image is rebuilt, so import it again after a rebuild. Delete `localhost-cert.pem` afterwards; it is ignored by Git.

### Backend development without Docker (optional)

PostgreSQL is not published on the host, so to run the backend with npm publish it temporarily:

```bash
docker compose run --rm -d -p 127.0.0.1:5432:5432 --name transcendence-db postgres
npm install
npm run prisma:migrate:deploy
npm run build
npm start                      # http://127.0.0.1:3000/
docker stop transcendence-db   # when finished
```

This uses the local values of `.env` (`HOST=127.0.0.1`, `DATABASE_URL` pointing to `127.0.0.1`).

### Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Compile TypeScript continuously in watch mode |
| `npm run build` | Generate Prisma Client and compile `src/` into `dist/` |
| `npm start` | Start `dist/server.js` |
| `npm run prisma:generate` | Regenerate Prisma Client |
| `npm run prisma:migrate:dev` | Create and apply a migration during development |
| `npm run prisma:migrate:deploy` | Apply pending migrations in staging or production |
| `npm run prisma:migrate:status` | Show migration status |
| `npm run prisma:format` | Format `prisma/schema.prisma` |
| `npm run prisma:validate` | Validate the Prisma schema |

## Resources

**TODO:** Lists classic references related to the topic (documentation, articles, tutorials, etc.).

Primary technical references:

- [Fastify documentation](https://fastify.dev/docs/latest/)
- [Prisma documentation](https://www.prisma.io/docs)
- [PostgreSQL documentation](https://www.postgresql.org/docs/)
- [Zod documentation](https://zod.dev/)
- [Node.js Crypto documentation](https://nodejs.org/api/crypto.html)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [WCAG 2.1](https://www.w3.org/TR/WCAG21/)

### AI usage

AI was not used for any task or any part of the project.

## Team Information

**TODO:** For each team member mentioned at the top of the README.md, provide:

- Assigned role(s): Product Owner, Project Manager/Scrum Master, Technical Lead, and Developer.
- Brief description of their responsibilities.

## Project Management

**TODO:** How the team organized the work (task distribution, meetings, etc.).

**TODO:** Tools used for project management (GitHub Issues, Trello, etc.).

**TODO:** Communication channels used (Discord, Slack, etc.).

## Technical Stack

**TODO:** Frontend technologies and frameworks used.

**TODO:** Backend technologies and frameworks used.

**TODO:** Database system and why it was chosen.

**TODO:** Any other significant technologies or libraries.

**TODO:** Justification for major technical choices.

| Area | Technology | Reason for use |
| --- | --- | --- |
| Runtime | Node.js with ESM | Modern JavaScript runtime and native cryptographic APIs |
| Language | TypeScript 5.9, strict mode | Static checks across routes, services, and repositories |
| Backend framework | Fastify 5 | Routing, lifecycle hooks, plugins, and request injection |
| Frontend framework | Next.js 16 | File-based routing, multiple rendering per-page, image optimization, font optimization, code splitting |
| Validation | Zod 4 and `fastify-type-provider-zod` | Runtime validation with inferred request types |
| Database | PostgreSQL 16 | Relational integrity, transactions, and concurrency controls |
| ORM | Prisma 6 | Typed database access and schema relationships |
| Test doubles | In-memory repositories | Fast tests without a database; never used outside `NODE_ENV=test` |
| Authentication | Cookies, `scrypt`, TOTP | Stateful sessions and optional second-factor protection |
| Local infrastructure | Docker Compose | Reproducible PostgreSQL service for development |
| Manual UI | HTML, CSS, and browser JavaScript | Development-only API testing without a separate client build |

## Database

### Database Schema

The schema is defined in [`prisma/schema.prisma`](./prisma/schema.prisma). A generated Entity-Relationship Diagram (ERD) is available at [`document/ERD.svg`](./document/ERD.svg) and is regenerated automatically every time "prisma generate" runs.

![TaskFlow Entity-Relationship Diagram](./document/ERD.svg)

### Domain model

The application is built around a five-level hierarchy:

```text
User → Organization → Board → List → Card
```

- User: A user can belong to multiple organizations and be assigned to cards across boards.
- Organization: The top-level container for shared work. Each organization has its own membership list and its own set of boards. A user's role inside an organization determines what they can do within it.
- Board: A workspace inside an organization. It contains ordered lists and its own set of labels. Boards are the primary unit users open to view and manipulate work.
- List: An ordered column inside a board. Lists hold cards and enforce a unique constraint (board_id, position) so that ordering is stable.
- Card: The atomic unit of work. A card belongs to a list and carries a title, description, optional due date, assignees, labels, and comments.

Secondary entities hang off the hierarchy:
- Comment: Attached to a card, authored by a user.
- Label: Scoped to a board, assignable to many cards through the "card_labels" join table.
- CardAssignee: The many-to-many link between users and cards.
- OrganizationMember / BoardMember: Explicit membership tables that carry a role and a join timestamp.

Authentication entities (PasswordCredential, Session, LoginChallenge, TwoFactorTotp, RecoveryCode) are isolated from the domain hierarchy and are only referenced by the User model.

### Roles

Roles are scoped at three levels, which allows a user to have different permissions in different contexts:

| Level | Model | Example roles | Controls |
| --- | --- | --- | --- |
| Application | "User.role" | "user", "moderator", "admin" | Application roles define how much authority users have over the platform as a whole, independent of any organization |
| Organization | "OrganizationMember.role" | "owner", "admin", "member" | Organization roles define how much authority users have over one organization: Its members, its boards, its settings, and its lifecycle |
| Board | "BoardMember.role" | "admin", "member" | Board roles define how much authority users have over one board and its contents: The lists, cards, comments, labels, and board-level membership |

### Deletion strategies

The schema uses two deletion strategies, chosen based on the entity's role in the domain:

- Soft deletes: "Board.archivedAt", "BoardList.archivedAt", "Card.archivedAt", "Organization.archivedAt", "Comment.deletedAt". These entities retain their row in the database, allowing recovery, audit trails, and referential integrity with historical data. Application queries filter on "archivedAt IS NULL" or "deletedAt IS NULL" by default.
- Hard deletes (cascade): When an Organization is physically deleted, its Boards are deleted ("onDelete: Cascade"), and so on down the hierarchy. Membership rows ("OrganizationMember", "BoardMember"), join rows ("CardAssignee", "CardLabel"), and dependent entities ("Comment", "BoardList", "Card") also cascade. This ensures that removing a parent does not leave orphaned rows.

### Composite primary keys

Four junction tables use composite primary keys instead of a surrogate "id" column. This enforces uniqueness at the database level and prevents duplicate relationships:

| Table | Composite key | Purpose |
| --- | --- | --- |
| "organization_members" | "(organization_id, user_id)" | A user can join an organization only once |
| "board_members" | "(board_id, user_id)" | A user can join a board only once |
| "card_assignees" | "(card_id, user_id)" | A user can be assigned to a card only once |
| "card_labels" | "(card_id, label_id)" | A label can be applied to a card only once |

Because the primary key is the natural composite, no additional unique index is required, and the database enforces the invariant without application-level checks.

### Database Migrations

Prisma Migrate is the only migration system used by the project, migration history is stored in `prisma/migrations`.

The initial migration contains the current schema:

1. `prisma/migrations/20260920120000_init/migration.sql`: users, credentials, sessions, 2FA, organizations, boards, lists, cards, board members, assignees, comments, and labels.

### Add a Migration

First, edit “prisma/schema.prisma” to add or modify a model in the schema file.

Then, run the following command:

```bash
prisma migrate dev --name <migration_name>
```

- The command detects drifts, checking if the database schema is out of sync with the migration history.
- It compares the new “schema.prisma” with the previous migration state and generates a new SQL migration file in “prisma/migrations/TIMESTAMP_name/migration.sql”.
- It runs the SQL file against the development database in the postgres container.
- It runs “prisma generate” automatically, regenerating the TypeScript client and updating its types.

Review the generated “migration.sql” file, check that Prisma didn’t do anything unexpected.

Finally, commit both the updated “schema.prisma” and the new migration directory to Git.

### Migration lock

The "migration_lock.toml" exists to lock the database provider for the migration history.
Its primary purpose is to prevent accidentally applying a set of migrations that were generated for one database type to a completely different database type.

```bash
find ./ -name "migration_lock.toml"
```

Prisma Migrate generates raw SQL files that are specific to the database provider being used.
The SQL syntax differs for different database providers.

If the provider is changed in the schema.prisma but the old migration files are kept, Prisma will fail attempting to run SQL files whose syntax does not match the database provider.

### Raw queries

All database access in this project goes through the Prisma Client API (`prisma.model.operation()`) with full type safety.
The exceptions are documented here.

```bash
# list all raw queries
grep -rn '\$queryRaw\|\$executeRaw\|\$queryRawUnsafe\|\$executeRawUnsafe' ./src
```

**File:** `src/modules/cards/cards.prismaRepository.ts`
**Functions:** `create()`, `move()`

**Why:** The `cards` table has a uniqueness constraint on `(list_id, position)`.
When two users create or move cards in the same list concurrently, both transactions would compute the same next position and one would fail with `P2002`.
To prevent this, we acquire a PostgreSQL transaction-scoped advisory lock keyed by the target list ID before computing the next position.
This serializes position computation per list, while allowing unrelated lists to proceed in parallel.

**Why not a Prisma query API:** Prisma has no API for advisory locks. 
They are a PostgreSQL-specific concurrency primitive. 
The alternative would be an application-level mutex (which wouldn't protect across multiple backend instances) or dropping the unique constraint (which would weaken data integrity).

**Safety:** The query uses Prisma's tagged-template `$queryRaw`, which parameterizes `${...}` values as SQL bind parameters (`$1`, `$2`, ...).
No string interpolation occurs. 
The lock is scoped to the enclosing transaction and released automatically on commit or rollback.

**Additional safety:** A retry wrapper (`withPositionRetry`) retries up to three times on `P2002` (unique constraint) and `P2034` (deadlock / serialization failure) errors, providing defense in depth against transient contention.

**File:** `src/modules/lists/lists.prismaRepository.ts`
**Functions:** `create()`, `reorder()`

**Why:** The create() and reorder() methods in lists.prismaRepository.ts use raw queries for the exact same purpose as the create() and move() methods in cards.prismaRepository.ts.
They prevent race conditions when calculating the next available integer for an ordered list, while working around PostgreSQL's @@unique constraint.

### In-memory repositories

The project uses the **repository pattern**: every data-access concern is expressed as an interface (e.g., `UsersRepository`, `BoardsRepository`), with two implementations.

| Implementation | Location | Purpose |
| --- | --- | --- |
| `Prisma*Repository` | `src/modules/*/<module>.prismaRepository.ts` | Production implementation, backed by Prisma Client |
| `InMemory*Repository` | `src/modules/*/<module>.repository.ts` | Test-only implementation, backed by `Map` and `Set` |

In-memory repositories exist solely to support unit tests without a database. They are never used in development, production, or the Docker deployment.

This invariant is enforced by two independent guards, so a misconfigured deployment fails loudly instead of silently degrading:

1. Configuration guard: Uses Zod's "superRefine" to require "DATABASE_URL" whenever "NODE_ENV" is "development" or "production". The application refuses to start if the variable is missing outside "NODE_ENV=test".
2. Composition guard: Selects the repository implementation based on "NODE_ENV". In any environment other than "test", it throws at startup if "createPrismaClient()" returned "null".

A misconfigured production container therefore exits immediately rather than serving requests against an empty in-memory store.

## Features List

**TODO:** Complete list of implemented features.

**TODO:** Which team member(s) worked on each feature.

**TODO:** Brief description of each feature’s functionality.

## Modules

**TODO:** List of all chosen modules (Major and Minor).

**TODO:** Point calculation (Major = 2pts, Minor = 1pt).

**TODO:** Justification for each module choice, especially for custom "Modules of choice".

**TODO:** How each module was implemented.

**TODO:** Which team member(s) worked on each module.

## Individual Contributions

**TODO:** Detailed breakdown of what each team member contributed.

**TODO:** Specific features, modules, or components implemented by each person.

**TODO:** Any challenges faced and how they were overcome.

