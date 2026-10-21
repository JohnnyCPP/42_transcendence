**TODO:** Write 42 logins.

*This project has been created as part of the 42 curriculum by pablgarc, jonnavar, [TODO].*

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

**TODO:** Contains any relevant information about compilation, installation, and/or execution.

**TODO:** Should mention all the needed prerequisites (software, tools, versions, configuration like .env setup, etc.), and step-by-step instructions to run the project.

### Prerequisites

- Node.js compatible with TypeScript 5.9 and Prisma 6.
- npm.
- Docker and Docker Compose for the provided PostgreSQL setup.

### Environment setup

Copy `.env.example` to `.env` and replace the TOTP encryption key with a Base64-encoded value that decodes to exactly 32 random bytes.

Required development variables:

```dotenv
NODE_ENV=development
HOST=127.0.0.1
PORT=3000
COOKIE_SECURE=false
SESSION_COOKIE_NAME=sid
SESSION_TTL_DAYS=14
TOTP_ISSUER=Transcendence
TOTP_ENCRYPTION_KEY_BASE64=replace-with-32-random-bytes-base64
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/transcendence
```

Do not commit `.env`. It is excluded through `.gitignore`.

### Install and run

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start PostgreSQL:

   ```bash
   docker compose up -d postgres
   ```

3. Apply the committed Prisma migrations:

   ```bash
   npm run prisma:migrate:deploy
   ```

4. Generate Prisma Client and compile TypeScript:

   ```bash
   npm run build
   ```

5. Start the compiled server:

   ```bash
   npm start
   ```

6. Open the manual development interface:

   ```text
   http://127.0.0.1:3000/
   ```

When the application starts outside the test environment, `DATABASE_URL` is required. Apply pending migrations explicitly with `npm run prisma:migrate:deploy` in deployment environments.

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

