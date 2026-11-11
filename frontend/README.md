# Frontend (Next.js)

UI de TaskFlow: App Router, React 19, TypeScript y Tailwind.

This folder has its own `package.json`, independent from the backend at the repo root (no npm workspaces).

## How to run

The supported way to run the full stack (Postgres + Fastify + Next with HTTPS) is Docker Compose from the **repository root**. See the root [`README.md`](../README.md).

```bash
# from repo root
docker compose up --build
```

App URL: `https://localhost/` (port `443`). The browser talks only to Next; `/api/*` is rewritten to Fastify.

`npm run dev` in this folder starts Next alone and does **not** start the API or database.

## Documentation

- Team onboarding (structure, routes, auth, boards, conventions): [`FRONTEND_DOCS.md`](./FRONTEND_DOCS.md)
- Stack startup, env, TLS certificate: root [`README.md`](../README.md)
