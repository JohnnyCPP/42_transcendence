<!--
/**
 * Documentación principal del proyecto.
 *
 * La sección Instructions explica como levantar todo con Docker, las
 * variables de entorno necesarias y como confiar en el certificado
 * autofirmado de https://localhost.
 */
-->

*This project has been created as part of the 42 curriculum by pablgarc, jonnavar, gsoteldo, jorexpos, jdiaz-he.*

# TaskFlow

## Table of Contents

- Description
- Instructions
- Resources
- Team Information
- Project Management
- Technical Stack
- Database Schema
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

   PostgreSQL uses `pg_isready`. Fastify's `/health` runs `SELECT 1` via Prisma and returns HTTP 503 when the database is unavailable. Next.js checks its own HTTPS homepage using `curl --insecure` because the local certificate is self-signed. Compose reports these checks with `docker compose ps`; an unhealthy status does not itself restart a container. The dependency checks control initial startup, not recovery after a later outage.

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

#### Configuration by container

The root `.env.example` is the single template. Copy it to `.env`, replace the example PostgreSQL password with a local password containing URL-safe characters, and generate a TOTP encryption key. The sample credentials are for local development only. Compose interpolates the root `.env`; it does not pass every value from that file into every container.

**PostgreSQL (runtime):** `POSTGRES_DB` and `POSTGRES_USER` default to `transcendence` and `postgres`; `POSTGRES_PASSWORD` is required. Compose also uses these values to construct the backend connection URL.

**Fastify (runtime):** `NODE_ENV` is `production` in Docker (`development`, `test`, or `production` elsewhere); `HOST` and `PORT` are `0.0.0.0` and `3000` in Docker. `DATABASE_URL` is a PostgreSQL URL required outside test: Compose constructs it for the container, while the template's value is for running the backend on the host. `TOTP_ENCRYPTION_KEY_BASE64` must decode to 32 random bytes and is required outside test; tests use a fixed non-secret key if omitted. `COOKIE_SECURE` is `true` in Compose and accepts `true` or `false`; `SESSION_COOKIE_NAME` defaults to `sid`, `SESSION_TTL_DAYS` to `14` positive whole days, and `TOTP_ISSUER` to `Transcendence`.

**Next.js (build and runtime):** `INTERNAL_API_URL` is the server-side backend URL, set to `http://fastify:3000` by Compose both at build time and runtime. Rewrites are generated at build time, so changing only its runtime value does not update them: rebuild the image when changing it. At runtime `HOST` and `PORT` default to `0.0.0.0` and `3000`; `HTTPS_CERT_PATH` and `HTTPS_KEY_PATH` point to the generated certificate and private key. `server.mjs` requires those paths and `INTERNAL_API_URL` and exits if they are missing. The image sets `NODE_ENV=production` and `NEXT_TELEMETRY_DISABLED=1`; Compose also passes `COOKIE_SECURE=true`, although the current frontend code does not use it.

No application `NEXT_PUBLIC_*` variables are currently used or deliberately exposed to the browser. If introduced, their values are public and Next.js embeds them during the frontend build: pass them as Docker build arguments and rebuild the image. Setting them only when the container starts will not update the client bundle. Never put secrets in them.

### HTTPS and the self-signed certificate

- `frontend/server.mjs` is a small Node.js HTTPS server that wraps Next.js, because `next start` cannot serve HTTPS.
- `frontend/scripts/generate-cert.sh` creates the certificate with OpenSSL while the image is built (valid for `localhost` and `127.0.0.1`, 365 days). It is never committed.
- `frontend/next.config.ts` proxies `/api/*` requests to Fastify, removing the `/api` prefix, so the browser only talks to `https://localhost`.

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
| Authentication | Cookies, `scrypt`, TOTP | Stateful sessions and optional second-factor protection |
| Local infrastructure | Docker Compose | Reproducible PostgreSQL service for development |
| Manual UI | HTML, CSS, and browser JavaScript | Development-only API testing without a separate client build |

## Database Schema

**TODO:** Visual representation or description of the database structure.

**TODO:** Tables/collections and their relationships.

**TODO:** Key fields and data types.

The main relationships are:

```text
User
|-- PasswordCredential
|-- Session
|-- LoginChallenge
|-- TwoFactorTotp
|-- RecoveryCode
|-- OrganizationMember -> Organization
|-- BoardMember ---------> Board
`-- created cards and comments

Organization
`-- Board
    |-- BoardMember
    |-- BoardList
    |   `-- Card
    |       |-- CardAssignee -> User
    |       |-- Comment ------> User
    |       `-- CardLabel ----> Label
    `-- Label
```

Lists and cards use integer positions with gaps (`1000`, `2000`, `3000`, and so on). PostgreSQL advisory locks protect position allocation and list reordering from concurrent requests. Cards are archived through `archivedAt` rather than physically deleted.
Prisma Migrate is the only migration system used by the project. The schema is defined in `prisma/schema.prisma`, and migration history is stored in `prisma/migrations`.

The initial migration contains the current schema:

1. `prisma/migrations/20260920120000_init/migration.sql`: users, credentials, sessions, 2FA, organizations, boards, lists, cards, board members, assignees, comments, and labels.

## Features List

### Roles and user administration

| Scope | Roles | Meaning |
| --- | --- | --- |
| Global | `user`, `moderator`, `admin` | Moderators and admins can read users; admins can manage them. |
| Organization | `member`, `admin`, `owner` | Membership roles used by organization operations. |
| Board | `observer`, `member`, `admin` | Observers have read-only access; members and admins have broader board permissions. |

Roles are defined in `src/modules/authorization/roles.ts` and constrained by Prisma enums. The role migration preserves existing values and fails on unknown values; inspect and correct any such records before applying it. Role assignments outside the user administration endpoints remain governed by their existing organization and board rules.

| Endpoint | Required global role | Purpose |
| --- | --- | --- |
| `GET /users` | moderator or admin | List users with `limit`, `offset`, optional `role` and `status` filters; deleted users are excluded by default. |
| `GET /users/:id` | moderator or admin | Read a user's public account fields. |
| `PATCH /users/:id` | admin | Update display name, email, role, or active/disabled status. |
| `DELETE /users/:id` | admin | Soft-delete another user, preserving related records. |
| `GET /admin/users` | admin | Existing legacy listing endpoint. |

Administrators cannot change their own role, disable their own account, or delete themselves. A database transaction serializes changes that could remove the last active administrator. Disabled and deleted accounts cannot authenticate. User responses do not contain password hashes, TOTP secrets or recovery codes.

To verify user administration against PostgreSQL, start a **fresh disposable** Compose project named `taskflow-rbac-check` on an available HTTPS port. The integration test creates and changes real users, including administrators; never point it at a shared or production database. With its frontend on port 8443, run in PowerShell:

```powershell
$env:RBAC_TEST_URL = 'https://localhost:8443'
$env:RBAC_TEST_POSTGRES_CONTAINER = 'taskflow-rbac-check-postgres-1'
npm run test:users:integration
```

The test expects an empty disposable database and a locally accessible Docker CLI. Administrative accounts need to be provisioned securely by the team; the demo seed is a separate backlog story.

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

