# RBAC demonstration

Use a dedicated disposable PostgreSQL database whose name ends in `_demo`. The seed creates or updates example accounts, their passwords, memberships and a board; do not use it on shared or production data. Start the application with that database and apply the Prisma migrations first. In Docker Compose, set `POSTGRES_DB` to a new name ending in `_demo` before starting a separate project, then explicitly run:

```sh
docker compose -p taskflow-demo exec -e NODE_ENV=development -e DEMO_SEED_CONFIRM=yes fastify npm run seed:demo
```

The script requires `NODE_ENV=development`, `DEMO_SEED_CONFIRM=yes`, and a `DATABASE_URL` pointing to a database ending in `_demo`. It can be run repeatedly without duplicating the three accounts, organization or board. It resets the demo accounts' roles and passwords. The password below is an example, not a production credential.

| Username | Email | Global role | Organization role | Board role |
| --- | --- | --- | --- | --- |
| `demo_admin` | `admin@example.com` | admin | owner | admin |
| `demo_moderator` | `moderator@example.com` | moderator | admin | implicit admin |
| `demo_user` | `user@example.com` | user | member | member |

All three accounts use password `ChangeMe123456!`. Sign in with the **username**. Select “Equipo de demostración” in Workspace and open “Tablero de demostración”.

1. As `demo_user`, the users page link and workspace member controls are absent; the board supports card editing but offers no delete-board action.
2. As `demo_moderator`, “Gestionar usuarios” opens a read-only table. In Workspace, member removal is visible for regular members, but role changes are not. The organization admin can administer the board, but cannot archive it without explicit board-admin membership.
3. As `demo_admin`, the users page offers editing and deletion of other users, Workspace offers role changes and member removal, and the board offers “Eliminar tablero”. The API prevents self-demotion and protects the last active admin.

The UI hides unavailable actions; the API enforces permissions independently. Removing demo members, changing roles, or archiving the board changes the demonstration; run the seed again to restore the three example memberships. Run the versioned role-matrix integration tests with `npm run test:rbac:integration`; they start their own isolated backend and PostgreSQL, and do not touch the demo database. The faster `npm run test:rbac` suite uses in-memory repositories.
