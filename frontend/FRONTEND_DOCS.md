# Frontend — documentación del equipo

Documento interno para cualquiera del proyecto (también si no has tocado Next.js ni esta rama).  
No forma parte del entregable funcional; sirve para onboarding, handoff y defensa.

---

## 1. ¿Qué es esta carpeta?

`frontend/` es la **interfaz web** de TaskFlow (proyecto tipo tablero Kanban / 42 Transcendence).

- El usuario abre el navegador → ve pantallas (login, dashboard, tablero…).
- Auth, workspaces (orgs + miembros), boards, **kanban (lists/cards/priority)**, 2FA, perfil (UI) y RBAC hablan con el **backend** (o dejan contrato listo si el endpoint aún falta).
- Quedan mocks puntuales (assignees del modal, widgets de actividad/velocidad del dashboard).

En una frase: **Next.js pinta la UI; el backend guarda usuarios, sesión, workspaces, boards, listas, cards y seguridad de cuenta.**

---

## 2. Conceptos rápidos (sin asumir Next.js)

| Idea | Qué significa aquí |
|------|-------------------|
| **Página / ruta** | Una URL. Ejemplo: `/login`, `/dashboard`. En Next viven en `app/.../page.tsx`. |
| **Componente** | Pieza de UI reutilizable (botón, header, formulario…). Carpeta `components/`. |
| **Hook** | Función React que da estado o lógica (`useAuth`, `useOrg`, `useBoards`…). Empiezan por `use`. |
| **Provider / Context** | “Caja” que guarda un estado **una sola vez** y lo reparte a toda la app (auth, org/workspace activo). |
| **Props** | Datos que un componente padre pasa a un hijo (`title="Hola"`, `onClick={…}`). |
| **JSX / TSX** | Sintaxis que mezcla HTML-like con JavaScript/TypeScript. Los archivos `.tsx` son componentes React tipados. |
| **`className`** | Atributo React equivalente a `class` en HTML: ahí van las clases CSS / Tailwind. |
| **Tailwind CSS** | Framework de utilidades: en lugar de escribir CSS a mano, pones clases en el JSX (`rounded-xl`, `bg-primary`, `flex`). El build genera solo el CSS usado. |
| **Token de color** | Nombre semántico de color del tema (`primary`, `on-surface`…) definido en `globals.css` (`@theme`) y usable como clase Tailwind (`bg-primary`). |
| **Cookie HttpOnly** | Cookie de sesión que el JS **no** puede leer; el navegador la envía solo en cada petición. Más seguro que guardar un token en `localStorage`. |
| **`localStorage`** | Almacén del navegador que persiste datos entre recargas (aquí: id del workspace activo). Visible al JS (no sirve para secretos). |
| **JWT** | JSON Web Token: cadena firmada que a veces se guarda en el cliente para auth. **Aquí no lo usamos en el front**; la sesión va por cookie. |
| **Mock** | Datos inventados en el front para demos UI (p. ej. `mockUsers`, Activity/Velocity) cuando el API aún no cubre ese caso. |
| **Endpoint** | URL concreta del backend que hace una acción (`POST /api/v1/login`, `GET /api/v1/organizations`). |
| **Rewrite / proxy** | El front llama a `/api/...` y Next **reenvía** esa petición a Fastify **conservando** el prefijo `/api`. El navegador solo habla con Next. |
| **CORS** | Regla del navegador que bloquea peticiones entre orígenes distintos. Aquí no hace falta pelear con CORS: el proxy hace que API y UI sean el mismo origen. |
| **2FA challenge** | Segundo paso del login cuando el BE responde `requires_2fa`; la UI pide TOTP o recovery code (`POST /api/v1/two-factor/login`). |
| **Barrel (`index.ts`)** | Archivo que **reexporta** varios módulos para importar desde una sola ruta: `from '@/components/ui'`. |
| **Alias `@/`** | Atajo de import: `@/components/...` = carpeta `frontend/components/...` (configurado en `tsconfig.json`). |
| **CTA** | *Call to action*: botón o enlace principal (“Crear proyecto”, “Entrar”). |
| **Shell / AppShell** | Marco visual que envuelve la app autenticada (sidebar + header + zona de contenido). |
| **Primitivo UI** | Componente genérico reutilizable (`Button`, `Icon`, `Dialog`…), no atado a un dominio (auth, kanban…). |
| **`uiStyles`** | Objeto con **strings de clases Tailwind** repetidas, centralizadas en `ui.styles.ts` (ver §17). |
| **`cx`** | Función pequeña nuestra que **une** varias clases en un solo string e ignora valores falsos (ver §17). |
| **Variante (`variant`)** | Aspecto distinto del mismo componente: botón `primary` (azul) vs `ghost` (sin fondo) vs `danger` (rojo). |
| **Material Symbols** | Librería de iconos de Google (fuente). Se usa con el nombre del glifo: `close`, `edit`, `star`… |
| **Empty state** | Pantalla o panel cuando no hay datos: “Aún no hay tableros”, error de carga, spinner… |
| **Modal / Dialog** | Ventana superpuesta sobre la página (confirmar borrar, filtrar, etc.). |
| **ESLint** | Herramienta que avisa de errores / malas prácticas en el código (`npm run lint`). |
| **TypeScript `strict`** | Modo del compilador más exigente con tipos (menos `any` silenciosos). |
| **Placeholder (pantalla)** | UI ya visible pero **sin** lógica/API real detrás (ej. forgot-password). |

### App Router (lo mínimo)

Next.js 16 organiza las URLs con carpetas bajo `app/` (App Router = el sistema de rutas moderno de Next):

- `app/login/page.tsx` → URL `/login`
- `app/layout.tsx` → envoltorio de **todas** las páginas (fuentes, `AuthProvider` + `OrgProvider`, etc.)

No hace falta saber más para orientarte en el repo.

---

## 3. Cómo arrancar (local)

El camino soportado es **Docker Compose** desde la **raíz del repo** (Postgres + Fastify + Next). Detalle completo en el [`README.md`](../README.md) de la raíz y un resumen en [`README.md`](./README.md) de esta carpeta.

```bash
# desde la raíz del repo
cp .env.example .env   # si aún no tienes .env
# rellena POSTGRES_PASSWORD y TOTP_ENCRYPTION_KEY_BASE64
docker compose up --build
```

Abre **`https://localhost/`** (puerto `443`). El certificado es autofirmado; cómo confiarlo está en el README root.

Flujo de red:

```text
Navegador --HTTPS:443--> nextjs --HTTP--> fastify:3000 --> postgres
```

- Solo el contenedor `nextjs` publica puerto en el host.
- `next.config.ts` reescribe `/api/:path*` → `${INTERNAL_API_URL}/api/:path*` (en Compose: `http://fastify:3000`).
- Ejemplo: `POST https://localhost/api/v1/login` → Fastify `POST /api/v1/login`.
- La cookie de sesión queda en el origen de Next. No hace falta CORS.

**Nota:** `npm run dev` dentro de `frontend/` arranca Next a solas (hot reload) y **no** levanta API ni DB. Sin Compose no resuelve el hostname `fastify`. Para la app completa usa siempre `docker compose up --build`.

Scripts del `frontend/package.json` (útiles sobre todo fuera de Compose):

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Next en modo desarrollo (no levanta el backend) |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build (HTTP; en Docker usamos `server.mjs` con HTTPS) |
| `npm run lint` | ESLint |

---

## 4. Stack

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript** (`strict`)
- **Tailwind CSS v4** + tokens en `app/globals.css` + estilos reutilizados en `components/ui/ui.styles.ts` (§17)
- Alias de imports: `@/` → raíz del frontend (`tsconfig.json`)

Ejemplo: `import { useAuth } from '@/components/auth'`  
es lo mismo que importar desde `frontend/components/auth`.

---

## 5. Modelo de dominio en la UI

```
Usuario
  └── Workspace (= organization en API/código)
        └── Boards / tableros
              └── Lists → Cards (kanban; API real)
```

### Convención de nombres (importante)

| Capa | Nombre | Ejemplo |
|------|--------|---------|
| **UI** (rutas, nav, copy) | **workspace** | `/workspace`, “Workspace” en el sidebar |
| **Código + API** | **organization** | `OrgProvider`, `useOrg`, `GET /organizations` |
| **Tableros** | **boards** | `/boards`, `useBoards` / `BoardsProvider`, `GET .../boards` |

Son el mismo contenedor: en pantalla “workspace”, en backend “organization”.  
No renombrar el módulo `components/org` solo por la UI.

---

## 6. Mapa de carpetas

```
frontend/
├── app/                 # Rutas (URLs) y layout raíz
├── components/          # UI por dominio (auth, org, boards, board, layout…)
│   └── ui/              # Primitivos + ui.styles.ts (Button, EmptyState…)
├── data/                # Mocks residuales (p. ej. mockUsers para assignees)
├── lib/                 # apiClient, securityApi, profileApi, useRoles
├── types/               # Tipos compartidos (ej. board / filtros kanban)
├── next.config.ts       # Rewrite /api → Fastify (INTERNAL_API_URL)
├── README.md            # Resumen corto + enlace a este doc y al README root
└── FRONTEND_DOCS.md     # Este documento
```

Convención: hooks y utils van **junto a la feature** (`kanbanBoard/`, `taskModal/…`), no en una carpeta global `hooks/`.

---

## 7. Rutas de la aplicación (`app/`)

| URL | Archivo | Qué es hoy |
|-----|---------|------------|
| `/` | `app/page.tsx` | Redirige a `/dashboard`. |
| `/dashboard` | `app/dashboard/page.tsx` | Resumen + boards de la org activa (API). **Protegida** + `RequireActiveOrg`. |
| `/workspace` | `app/workspace/page.tsx` | Switcher + crear workspace (`useOrg`). **Protegida**. |
| `/workspace/settings` | `app/workspace/settings/page.tsx` | Hub del workspace activo: editar name/slug, archivar (`DELETE`, owner) + miembros. **Protegida** + `RequireActiveOrg`. |
| `/settings` | `app/settings/page.tsx` | Seguridad de cuenta (reauth, password, 2FA + QR; `securityApi`). **Protegida**. |
| `/profile` | `app/profile/page.tsx` | Perfil propio (displayName / email). UI lista; `PATCH /me` pendiente de BE. **Protegida**. |
| `/security` | `app/security/page.tsx` | **Redirect** a `/settings` (bookmarks antiguos). |
| `/users` | `app/users/page.tsx` | Gestión de usuarios (mod/admin; `GET/PATCH/DELETE /users`). **Protegida** + rol. |
| `/boards` | `app/boards/page.tsx` | Listado de tableros de la org activa (API). **Protegida** + `RequireActiveOrg`. |
| `/boards/[boardId]` | `app/boards/[boardId]/` | Kanban (lists/cards) + permisos `GET /boards/:id/access`. **Protegida** + `RequireActiveOrg`. |
| `/projects/new` | `app/projects/new/page.tsx` | Crear board vía `POST .../boards` (si `canCreateBoard`). **Protegida** + `RequireActiveOrg`. |
| `/login` | `app/login/page.tsx` | Login real (backend). Pública. |
| `/signup` | `app/signup/page.tsx` | Registro real (backend). Pública. |
| `/forgot-password` | `app/forgot-password/page.tsx` | Placeholder (no hay API aún). Pública. |
| `/privacy` | `app/privacy/page.tsx` | Política de privacidad (mandatory). Pública. |
| `/terms` | `app/terms/page.tsx` | Términos de servicio (mandatory). Pública. |
| *(cualquier ruta inválida)* | `app/not-found.tsx` | Página 404. |

**Nota 2FA:** la única UI de gestión es **`/settings`** (menú → Ajustes). Hidrata con `GET /two-factor/status`, setup con QR (`qrcode.react`), recovery codes en modal tras confirm/regenerate. `/security` solo redirige. Tras login con recovery code, si quedan ≤1 codes → `/settings`. **No** hay contador de “códigos restantes” en settings (opcional; no requerido por la story).

**Protegida** = `ProtectedRoute` (sesión).  
**RequireActiveOrg** = hace falta workspace activo; si no, redirige a `/workspace`.

---

## 8. Componentes por dominio (`components/`)

### `auth/` — sesión y acceso
- `AuthProvider.tsx` — guarda el estado de sesión **una vez** y lo reparte (Context).
- `useAuth.ts` — hook consumidor (`login`, `logout`, `signup`, `user`, `isLoading`…).
- `ProtectedRoute.tsx` — guardia de páginas privadas.
- `login/` / `signup/` — UI partida (contenedor + vista + formulario).
- `auth.types.ts` — contrato de tipos.

### `layout/` — marco de la app autenticada
- `AppShell.tsx` — Sidebar + Header + `<main>`.
- `Header.tsx` + `header/` — búsqueda, notificaciones, perfil/logout (`ProfileMenu` → `/profile` + `/settings`).
- `Sidebar.tsx` + `sidebar/` — logo (workspace activo), nav Panel / Workspace / Tableros / Usuarios (si rol), CTA “Crear proyecto” (si `canCreateBoard`).
- `LegalLinks.tsx` / `LegalDocumentLayout.tsx` — Privacy y Terms.

### `org/` — organization (= workspace en UI)
- `OrgProvider.tsx` + `useOrg.ts` — `GET/POST/PATCH/DELETE /organizations`; org activa en `localStorage`.
- Persistencia: clave `taskflow.activeOrganizationId` (ver §10).
- `RequireActiveOrg.tsx` — guardia de workspace activo (paralela a `ProtectedRoute`).
- `OrganizationCard.tsx` / `CreateOrganizationForm.tsx` — UI del switcher (`/workspace`).
- `WorkspaceSettingsPage.tsx` + `useWorkspaceSettings.ts` — hub: editar/archivar (gates `canManageOrganization` / `canArchiveOrganization`) + miembros.
- `OrganizationMembers.tsx` + `useOrganizationMembers.ts` — lista, cambiar rol, retirar (`ConfirmDialog`), add-member form.
- `AddOrganizationMemberForm.tsx` — username (+ email opcional) + rol; llama `POST …/members` (**BE pendiente**).
- `org.types.ts` — roles, `ORGANIZATION_ROLE_LABELS`, barrel `index.ts`.

### `settings/` — seguridad de cuenta (`/settings`)
- `SettingsPage.tsx` — reauth + password + 2FA (enlace “Ajustes” del `ProfileMenu`).
- `ReauthSection` / `PasswordSection` + hooks `useReauthForm` / `usePasswordForm`.
- `twoFactor/` — setup (QR + secreto/URI) / confirm / regenerate / disable; modal de recovery codes; `useTwoFactorForm` hidrata con `GET /two-factor/status`.
- Llamadas tipadas: `lib/securityApi.ts` → `/api/v1` (incl. `getTwoFactorStatus`).
- **No** se muestra contador de recovery codes restantes en esta página (opcional; login ya redirige si quedan ≤1).

### `profile/` — perfil de cuenta (`/profile`)
- `ProfilePage.tsx` + `useProfileForm.ts` — username (read-only), displayName, email.
- `lib/profileApi.ts` — `PATCH /me` (contrato FE; self-service BE pendiente). Tras guardar → `refreshToken()` (`GET /me`).

### `app/security/`
- Solo `redirect('/settings')`. La UI legacy de 2FA y `RecoveryCodesDialog` se retiraron.

### Roles (`lib/useRoles.ts`)
- Global: `canReadUsers`, `canManageUsers`.
- Org (desde `activeOrganization.role` o board access): `canCreateBoard`, `canManageOrganization` (owner|admin), `canManageOrgAdmins` (owner), `canArchiveOrganization` (owner).
- Board: `canWriteBoard`, `canArchiveBoard` vía `GET /boards/:id/access`.

### `boards/` — listado / fetch de tableros (plural)
- `BoardsProvider.tsx` + `useBoards.ts` — `GET` + `createBoard` + `updateBoard` (`PATCH`) + `deleteBoard` (`DELETE` archive).
- `useBoardActions.ts` + `BoardCardMenu.tsx` — renombrar/eliminar (cards y cabecera kanban).
- `mapBoardToCard.ts` — adapta `Board` del API → props de `BoardCard`.
- `board.types.ts` / `boards.types.ts` — tipos alineados al backend.

### `board/` — Kanban (singular)
- `boardApi.ts` — cliente HTTP (`getBoard`, lists/cards CRUD + `priority`, move, archive list/card).
- `boardApi.types.ts` — `ApiList` / `ApiCard` (JSON del backend; incluye `priority`).
- `mapBoardApi.ts` — adaptadores API → UI (`TaskItem` / `BoardColumn`).
- `kanbanBoard/` — orquestador + `useKanbanState` + `useKanbanHandlers` + utils; respeta `canWrite`.
- `kanbanColumn/`, `taskModal/`, `taskCard/`.
- `boardHeader/` — título, filtros (`BoardFilterDialog`), share (`BoardShareDialog` = copiar URL), menú ⋯ (`BoardCardMenu`).
- `BoardPageClient` — carga también `GET /boards/:id/access` para RBAC de escritura/archivo.

### `dashboard/`
- Barrel `index.ts` + `dashboard.types.ts`.
- `DashboardHero`, `BoardCard`.
- `ActivityFeed`, `VelocityWidget` — **UI mock** (no hay API de actividad/métricas; se mantienen para demo/corrección).

### `ui/` — primitivos y estilos compartidos
- `ui.styles.ts` — constantes Tailwind (`uiStyles`) + helper `cx` (ver §17).
- `Button` (+ `buttonClassName` para Links) — variantes primary / secondary / ghost / danger.
- `Icon` — Material Symbols Outlined con tamaños sm–xl.
- `EmptyState` — panel dashed (loading / error / vacío).
- `FormErrorBanner` — banner de error de formulario reutilizable.
- `AuthCard` — shell + card de páginas auth / marketing.
- `TextInput` — input controlado con label/error.
- `Dialog`, `InfoDialog`, `ConfirmDialog`, `TextInputDialog` — modales (footers con `Button`).
- `index.ts` — barrel: `import { Button, uiStyles } from '@/components/ui'`.

---

## 9. Cómo habla el front con el backend

1. Las llamadas pasan por `lib/apiClient.ts` → `apiFetch` (cookies + JSON + errores unificados).
2. El código llama rutas relativas; `apiFetch` antepone `API_BASE` (`NEXT_PUBLIC_API_BASE` o `/api/v1` por defecto).
3. Errores de Fastify `{ error, message }` llegan como `ApiError` (`error` + `message` + `status`).
4. Next reescribe `/api/:path*` → `${INTERNAL_API_URL}/api/:path*` (Compose: `http://fastify:3000`), **sin** quitar el prefijo `/api`.
5. Login / register / login 2FA dejan cookie HttpOnly; el resto de peticiones la llevan solas.

| Acción | Método | Path en código | URL final en navegador |
|--------|--------|----------------|------------------------|
| Sesión actual | `GET` | `/me` | `/api/v1/me` |
| Actualizar perfil propio | `PATCH` | `/me` | `/api/v1/me` (**FE listo; BE pendiente**) |
| Login | `POST` | `/login` | `/api/v1/login` |
| Completar 2FA | `POST` | `/two-factor/login` | `/api/v1/two-factor/login` |
| Reautenticar | `POST` | `/reauthenticate` | `/api/v1/reauthenticate` |
| Cambiar password | `POST` | `/change-password` | `/api/v1/change-password` |
| 2FA begin | `POST` | `/two-factor/begin` | `/api/v1/two-factor/begin` |
| 2FA confirm | `POST` | `/two-factor/confirm` | `/api/v1/two-factor/confirm` |
| 2FA regenerate codes | `POST` | `/two-factor/regenerate` | `/api/v1/two-factor/regenerate` |
| 2FA disable | `DELETE` | `/two-factor` | `/api/v1/two-factor` |
| Actualizar org | `PATCH` | `/organizations/:id` | `/api/v1/organizations/:id` |
| Actualizar board | `PATCH` | `/boards/:boardId` | `/api/v1/boards/:boardId` |
| Registro | `POST` | `/register` | `/api/v1/register` |
| Logout | `POST` | `/logout` | `/api/v1/logout` |
| Listar orgs | `GET` | `/organizations` | `/api/v1/organizations` |
| Crear org | `POST` | `/organizations` | `/api/v1/organizations` |
| Listar boards | `GET` | `/organizations/:orgId/boards` | `/api/v1/organizations/:orgId/boards` |
| Crear board | `POST` | `/organizations/:orgId/boards` | `/api/v1/organizations/:orgId/boards` |
| Obtener board | `GET` | `/boards/:boardId` | `/api/v1/boards/:boardId` |
| Listas del board | `GET` | `/boards/:boardId/lists` | `/api/v1/boards/:boardId/lists` |
| Crear lista | `POST` | `/boards/:boardId/lists` | `/api/v1/boards/:boardId/lists` |
| Renombrar lista | `PATCH` | `/lists/:listId` | `/api/v1/lists/:listId` |
| Archivar lista | `DELETE` | `/lists/:listId` | `/api/v1/lists/:listId` |
| Cards de una lista | `GET` | `/lists/:listId/cards` | `/api/v1/lists/:listId/cards` |
| Crear card | `POST` | `/lists/:listId/cards` | `/api/v1/lists/:listId/cards` |
| Editar card | `PATCH` | `/cards/:cardId` | `/api/v1/cards/:cardId` |
| Mover card | `POST` | `/cards/:cardId/move` | `/api/v1/cards/:cardId/move` |
| Archivar card | `DELETE` | `/cards/:cardId` | `/api/v1/cards/:cardId` |
| Archivar board | `DELETE` | `/boards/:boardId` | `/api/v1/boards/:boardId` |
| Acceso board (RBAC) | `GET` | `/boards/:boardId/access` | `/api/v1/boards/:boardId/access` |
| 2FA status | `GET` | `/two-factor/status` | `/api/v1/two-factor/status` |
| Recovery codes restantes | `GET` | `/two-factor/recovery-codes/remaining` | `/api/v1/two-factor/recovery-codes/remaining` |
| Miembros org | `GET` | `/organizations/:id/members` | `/api/v1/organizations/:id/members` |
| Añadir miembro (username) | `POST` | `/organizations/:id/members` | `/api/v1/organizations/:id/members` (**FE listo; BE pendiente**; body `{ username, role, email? }`) |
| Rol miembro org | `PUT` | `/organizations/:id/members/:userId` | `/api/v1/organizations/:id/members/:userId` |
| Quitar miembro org | `DELETE` | `/organizations/:id/members/:userId` | `/api/v1/organizations/:id/members/:userId` |
| Archivar org | `DELETE` | `/organizations/:id` | `/api/v1/organizations/:id` |
| Listar usuarios (mod+) | `GET` | `/users` | `/api/v1/users` |
| Reorder listas (sin UI) | `POST` | `/boards/:boardId/lists/reorder` | `/api/v1/boards/:boardId/lists/reorder` |

**FE listo, BE pendiente:** `POST /organizations/:id/members` (add por username), `PATCH /me` (perfil self-service).

**BE existe, FE parcial o sin UI:** comentarios de card, miembros de board, reorder de columnas; `GET …/recovery-codes/remaining` (solo usado al redirigir tras login, sin contador en settings).

**Fuera de la app de sesión (otros módulos):** `/api/v1/public/*`, `/api/v1/api-keys`. Friends: sin API ni UI (pendiente de aclarar si es módulo propio o = members).

Body auth: `username` + `password` (+ `email` opcional en register). **Sin JWT en localStorage.**  
Kanban: `components/board/boardApi.ts` + mappers; handlers en `useKanbanHandlers`.

---

## 10. Autenticación + workspace activo

### Piezas
1. En `app/layout.tsx`: `AuthProvider` → `OrgProvider` → `BoardsProvider`.
2. `AuthProvider` al montar llama a `GET /api/v1/me`. Empieza con `isLoading: true` y `isAuthenticated: false`.
3. `OrgProvider` **espera** a `!isAuthLoading` antes de cargar orgs o limpiar storage.
4. Si hay sesión → `GET /organizations`; si la lista está vacía, crea una org por defecto.
5. Restaura `activeOrganization` desde `localStorage` (`taskflow.activeOrganizationId`) si el id sigue en la lista; si no, usa la primera.
6. Elegir/crear workspace escribe el id en storage; logout (auth ya resuelta y sin sesión) lo borra.
7. `BoardsProvider` carga/crea tableros de la org activa (`useBoards`).
8. `ProtectedRoute` + `RequireActiveOrg` en páginas de producto.
9. Login: si el BE responde `requires_2fa`, la UI pasa al segundo paso (`TwoFactorForm`) y completa con `complete2fa` → `POST /two-factor/login`. Signup y login autenticado redirigen (p. ej. al dashboard); si quedan ≤1 recovery codes tras login con recovery, redirige a `/settings`.
10. Header → `ProfileMenu`: Mi perfil (`/profile`), Ajustes (`/settings`), logout → `/login`.

**Nota 2FA:** challenge de login en `TwoFactorForm`. Gestión solo en **`/settings`** (`securityApi` + QR + `GET /two-factor/status`). Sin UI de contador de codes restantes (no obligatorio).

### Por qué esperar a `isAuthLoading`
Si al montar se tratara `isAuthenticated === false` como “logout real”, se borraría el id del workspace en **cada F5** antes de recuperar la cookie. Por eso el effect de org no limpia storage mientras auth sigue cargando.

### Flujo mental
```
Usuario abre /dashboard
  → ProtectedRoute (sesión)
  → RequireActiveOrg (workspace activo)
  → useBoards (BoardsProvider) lee activeOrganization.id
  → GET /organizations/:id/boards

Usuario abre /boards/:boardId
  → mismos guards + AppShell
  → Promise.all(getBoard, getBoardColumns, GET /boards/:id/access)
  → BoardHeader + KanbanBoard (canWrite según access)
  → mutaciones vía useKanbanHandlers → boardApi
```

### Archivos clave
- `components/auth/AuthProvider.tsx`, `useAuth.ts`, `ProtectedRoute.tsx`
- `components/org/OrgProvider.tsx`, `useOrg.ts`, `RequireActiveOrg.tsx`, `OrganizationMembers.tsx`, `useOrganizationMembers.ts`
- `app/workspace/page.tsx`, `app/workspace/settings/`, `app/settings/page.tsx`, `app/profile/page.tsx`, `app/users/page.tsx`
- `components/boards/BoardsProvider.tsx`, `useBoards.ts`
- `lib/useRoles.ts`, `lib/securityApi.ts`, `lib/profileApi.ts`

---

## 11. Decisiones de diseño del código (para defensa)

Tomadas por **gsoteldo** para el frontend. Si alguien propone otra aproximación, se discute en equipo y luego se aplica (o no).

### A) Por dominio, no por “tipo de archivo”
Auth junto a auth, kanban junto a kanban, boards (listado) separado de board (kanban).

### B) Separar presentación / estado / utils
Ejemplo kanban: orquestador + hooks de estado/handlers + utils puras.  
Auth login/signup: contenedor + vista + formulario.

### C) Mock → real por etapas
Auth, orgs/workspace (incl. miembros), boards, lists/cards (con **priority**), 2FA y RBAC de board ya van al API.  
Mocks residuales: assignees (`mockUsers`), Activity/Velocity del dashboard.

### D) Layout compuesto
`AppShell` + `header/` + `sidebar/`.

### E) Cliente HTTP único
`lib/apiClient.ts` (`apiFetch` + `ApiError`) para auth, orgs, boards, kanban (`boardApi.ts`) y `/users`. Capas tipadas: `lib/securityApi.ts` (`/settings`), `lib/profileApi.ts` (`/profile`).

### F) UI “workspace” / código “organization”
Misma entidad; nombres distintos por capa (ver §5).

### G) Estilos: constantes + componentes
Si la misma cadena Tailwind se copia **más de dos veces**, se saca a `ui.styles.ts` y, si además hay markup reutilizable, a un componente en `components/ui/` (ver §17).  
No hay librerías extra de clases: solo el helper `cx`.

---

## 12. Kanban (resumen)

- Ruta: `/boards/[boardId]` (`BoardPageClient` + `AppShell` + `RequireActiveOrg`).
- Carga: `Promise.all([getBoard, getBoardColumns, GET /boards/:id/access])`.
- Capa HTTP: `components/board/boardApi.ts`.
- Mappers: `mapBoardApi.ts` (`ApiList`/`ApiCard` → `BoardColumn`/`TaskItem`; `priority` desde API).
- Orquestador: `KanbanBoard.tsx` + `useKanbanState` + `useKanbanHandlers` (mutaciones solo si `canWrite`).
- Header: título real; share = copiar URL `/boards/:boardId` (sin API de invitaciones).

### Persistido en API (handlers)
| UI | API |
|----|-----|
| Añadir columna | `POST /boards/:id/lists` |
| Renombrar columna | `PATCH /lists/:id` |
| Borrar columna | `DELETE /lists/:id` (archive) |
| Añadir / duplicar tarea | `POST /lists/:id/cards` (+ `priority`) |
| Guardar tarea | `PATCH /cards/:id` (+ `priority`; `POST .../move` si cambia lista) |
| Borrar tarea | `DELETE /cards/:id` (archive) |

### Aún local / limitado
- **Assignees**: solo UI (`mockUsers` en el modal).
- **Priority**: **sí** persistida en BE; filtros de prioridad en header son locales.
- **`commentsCount`**: campo UI opcional; **no** hay CRUD de comentarios en el FE (BE: `/cards/:id/comments`).
- **Reorder de listas**: BE tiene `POST .../lists/reorder`; la UI aún no mueve columnas.
- **Miembros de board**: BE `PUT`/`DELETE /boards/:id/members/:userId`; FE no cableado (share = URL).

---

## 13. Estado actual (honestidad para el equipo)

### Ya conectado al backend (`/api/v1`)
- Login, registro, logout, `/me`
- Login 2FA (`requires_2fa` → `POST /two-factor/login`)
- `/settings`: reauth, password, 2FA begin/confirm/regenerate/disable, `GET /two-factor/status`, QR, modal recovery codes
- Organizations: listar, crear, `PATCH`, `DELETE` (owner); miembros list/change-role/remove en `/workspace/settings` (gates por rol en UI)
- Boards: listar por org, crear, `GET` / `PATCH` / `DELETE` archive; `GET …/access` para RBAC
- Lists / cards: CRUD + move + archive list/card; **priority** en create/update; duplicate vía create
- `/users` (mod/admin): listar / patch / delete

### FE listo, esperando BE
- Add-member org: UI + `POST /organizations/:id/members` `{ username, role, email? }`
- Profile: UI `/profile` + `PATCH /me` `{ displayName, email }`

### Funcional en UI (mock, stub o sin API completa)
- Widgets Activity / Velocity del dashboard
- Assignees del modal (`mockUsers`)
- Forgot-password (solo pantalla)
- Privacy, Terms, 404
- Share board: copiar URL
- Comentarios de card: sin UI de CRUD
- Contador de recovery codes restantes: **no** en settings (opcional); login usa `…/remaining` solo para redirigir si ≤1

### Pendiente de cablear / decidir
- Reorder de listas (`POST …/lists/reorder`) + UI
- Miembros de board + comentarios de card
- Friends (¿módulo amigos o = members?). Sin API ni UI hasta aclarar
- Public API / API Keys UI (otros módulos)
- Tests de auth / utils kanban

---

## 14. Cómo orientarte si entras nuevo

1. Lee este doc (§5 nombres + §10 auth/workspace + §17 estilos UI).
2. Arranca con `docker compose up --build` (README root); prueba login → `/workspace` → `/workspace/settings` → dashboard → board → logout → F5 mantiene workspace.
3. `app/layout.tsx` → providers; páginas de producto → `ProtectedRoute` + `RequireActiveOrg` + `AppShell`.
4. Auth: `components/auth/` (login incluye `TwoFactorForm`). Seguridad: `/settings`. Perfil: `/profile`.
5. Workspace: `components/org/` — switcher en `/workspace`; hub (editar + miembros + add-member UI) en `/workspace/settings`.
6. Boards listado: `components/boards/`. Kanban: `components/board/` + `BoardPageClient` (access + `useRoles`).
7. HTTP: `lib/apiClient.ts`. Roles: `lib/useRoles.ts`. Tipados: `securityApi.ts`, `profileApi.ts`.
8. Admin usuarios: `app/users/`. UI reutilizable: `components/ui/` (incl. `surfaceCard`).

---

## 15. Frase corta para defensa oral

> Frontend por dominio, con AppShell, auth por cookie HttpOnly (login + challenge 2FA), OrgProvider (workspace) con org activa en localStorage, miembros y settings de org en hub `/workspace/settings`, boards filtrados por org, kanban con lists/cards/priority y RBAC por `GET …/access`, seguridad de cuenta en `/settings` y perfil en `/profile`. Stack vía Docker Compose; Next proxifica `/api` a Fastify (`/api/v1`). Estilos en `uiStyles` + primitivos. Pendiente BE: add-member por username y `PATCH /me`.

---

## 16. Índice rápido de archivos

| Tema | Dónde mirar |
|------|-------------|
| Layout raíz / providers | `app/layout.tsx` |
| Shell autenticado | `components/layout/AppShell.tsx` |
| Header / Sidebar | `components/layout/Header.tsx`, `header/`, `Sidebar.tsx`, `sidebar/` |
| Cliente API | `lib/apiClient.ts` (`apiFetch`, `ApiError`) |
| Proxy `/api` → Fastify (`INTERNAL_API_URL`) | `next.config.ts` |
| Auth | `AuthProvider.tsx`, `useAuth.ts`, `ProtectedRoute.tsx`, `login/` (incl. `TwoFactorForm`), `signup/` |
| Settings cuenta (2FA) | `components/settings/` (incl. `twoFactor/` + QR), `app/settings/`, `lib/securityApi.ts` |
| Perfil | `components/profile/`, `app/profile/`, `lib/profileApi.ts` |
| Redirect 2FA antigua | `app/security/page.tsx` → `/settings` |
| Usuarios (mod+) | `app/users/page.tsx` |
| Roles UI | `lib/useRoles.ts` |
| Workspace (org) | `OrgProvider`, `useOrg`, `RequireActiveOrg`, `OrganizationMembers`, `useOrganizationMembers`, `AddOrganizationMemberForm`, `WorkspaceSettingsPage`, `app/workspace/` |
| Boards (listado API) | `BoardsProvider.tsx`, `useBoards.ts`, `useBoardActions`, `BoardCardMenu`, `app/boards/page.tsx`, `app/dashboard/page.tsx` |
| Crear board | `BoardsProvider.createBoard`, `app/projects/new/page.tsx` |
| Kanban (página) | `app/boards/[boardId]/BoardPageClient.tsx` |
| Kanban (API + mappers) | `components/board/boardApi.ts`, `boardApi.types.ts`, `mapBoardApi.ts` |
| Kanban (UI/handlers) | `kanbanBoard/`, `boardHeader/`, `kanbanColumn/`, `taskModal/` |
| Legal / 404 | `app/privacy/`, `app/terms/`, `app/not-found.tsx` |
| Mock assignees | `data/mockBoardData.ts` (`mockUsers`) |
| Tokens / kanban CSS | `app/globals.css` |
| Estilos UI reutilizados | `components/ui/ui.styles.ts` + §17 |
| Primitivos UI | `components/ui/` (`Button`, `Icon`, `EmptyState`, `FormErrorBanner`, `AuthCard`, dialogs…) |

---

## 17. Sistema de estilos UI (`components/ui/`)

### Por qué existe
Antes, la misma cadena larga de clases Tailwind se pegaba en muchos archivos (botones azules, paneles vacíos, cards de login…). Si cambiabas el radio o el color, había que tocar N sitios.

Criterio: **si se repite más de dos veces → sacarlo**.

Hay dos niveles:

1. **`uiStyles`** — solo el string de clases (cuando el HTML ya está y solo quieres la misma pinta).
2. **Componentes** (`Button`, `EmptyState`…) — HTML + clases + props (cuando el bloque entero se reutiliza).

### Piezas que hay que conocer

#### `uiStyles` (archivo `ui.styles.ts`)
Objeto TypeScript. Cada clave es un nombre legible; el valor es el string de clases Tailwind.

```ts
uiStyles.pageTitle
// → "text-3xl font-bold tracking-tight text-on-surface md:text-4xl"
```

Uso en JSX:

```tsx
<h1 className={uiStyles.pageTitle}>Tus workspaces</h1>
```

Así el título se escribe **una vez** y todas las páginas lo comparten.

#### `cx` (mismo archivo)
Función de ~1 línea que **concatena** clases y salta lo que sea `false` / `null` / `undefined`.

```ts
cx('rounded-xl', isActive && 'bg-primary', className)
// si isActive es true  → "rounded-xl bg-primary mi-extra"
// si isActive es false → "rounded-xl mi-extra"
```

Sin `cx` harías `.filter(Boolean).join(' ')` a mano en cada sitio.  
**No es una librería npm**: está definida en el repo.

#### `Button` y `buttonClassName`
- `<Button variant="primary" size="lg">` → renderiza un `<button>` con las clases correctas.
- `buttonClassName({ variant: 'secondary' })` → **solo el string** de clases, para cuando el elemento no puede ser `<button>` (p. ej. un `Link` de Next a otra ruta).

Variantes: `primary` (CTA azul), `secondary` (borde), `ghost` (cancelar), `danger` (borrar).  
Tamaños: `sm` / `md` / `lg` (más o menos padding vertical).

#### `Icon`
Envuelve un icono Material Symbols. Props: `name` (ej. `"close"`), `size` (`sm`–`xl`), `pulse` (animación de carga), `filled` (estrella rellena, etc.).

#### `EmptyState`
Caja con borde discontinuo (dashed) + icono + título/descripción. Sirve para “cargando…”, “error” o “aún no hay datos”. El `children` es un hueco para un botón/enlace opcional.

#### `AuthCard`
Plantilla de páginas públicas: fondo centrado (`authShell`) + tarjeta blanca (`authCard`) + badge opcional + título. Signup, forgot-password, crear proyecto y 404 la usan. Login monta el shell/card a mano porque tiene cabecera propia.

#### Dialogs
- `Dialog` — modal base (overlay, título, cerrar).
- `InfoDialog` — un botón “Entendido”.
- `ConfirmDialog` — Cancelar + Confirmar (o borrar en rojo).
- `TextInputDialog` — pedir un texto (ej. nombre de columna).

Todos los footers usan `Button`.

#### `FormErrorBanner`
Banner de error de formulario (borde + icono). Acepta `error` nulo (no renderiza) y `className` opcional. Login, signup, settings y workspace lo reutilizan.

### Qué va dónde (atajo)

| Necesitas… | Usar |
|------------|------|
| Solo reutilizar una clase | `uiStyles.…` |
| Un `<button>` con estilo de producto | `<Button variant="…" size="…" />` |
| El mismo estilo en un `Link` | `className={buttonClassName({ … })}` |
| Un icono | `<Icon name="…" size="md" />` |
| Lista vacía / loading / error | `<EmptyState … />` |
| Página auth con badge + título | `<AuthCard …>` |
| Input con label / error | `<TextInput … />` (o `uiStyles.input` en un input suelto) |
| Modal | `Dialog` / `InfoDialog` / `ConfirmDialog` / `TextInputDialog` |

### Claves de `uiStyles` (resumen)

| Clave | Qué pinta |
|-------|-----------|
| `button.*` | Estilos internos del `Button` (no hace falta tocarlos a mano) |
| `input` / `formLabel` | Campo de formulario y su etiqueta |
| `icon.*` | Tamaños del `Icon` |
| `emptyState` | Panel con borde discontinuo |
| `authCard` / `authShell` / `pageBadge` | Card y fondo de páginas auth / marketing |
| `pageKicker` | Texto pequeño en mayúsculas encima del título (“BOARDS”) |
| `pageTitle` / `pageLead` | Título H1 y subtítulo |
| `pageContent` | Zona scrolleable dentro del `AppShell` |
| `infoCallout` | Caja azul clara de mensaje (éxito / hint) |
| `surfaceCard` | Card blanca con borde/sombra (settings, workspace settings, profile…) |
| `dropdownItem` / `dropdownItemDanger` | Filas del menú ⋮ en columnas/tarjetas del kanban |

### Dónde se consume hoy

| Área | Qué usa |
|------|---------|
| Dialogs | `Button`, `TextInput`, `Icon` |
| Login / signup / forgot-password / projects/new / 404 | `AuthCard`, `Button` / `buttonClassName`, `TextInput`, `uiStyles` |
| boards / dashboard / workspace / profile | `EmptyState`, `pageContent` / kicker / title / lead, `surfaceCard` |
| BoardHeader, ColumnHeader, TaskCard, KanbanBoard | `Button`, `Icon`, `dropdownItem*`, `EmptyState` |

### Cómo añadir un estilo nuevo

1. ¿La misma combinación de clases aparece **3 o más** veces? → nueva entrada en `uiStyles`.
2. ¿Además se repite el HTML (icono + título + botón…)? → componente nuevo en `components/ui/` que lea `uiStyles`.
3. Si el componente es de uso general → exportarlo en `index.ts`.
4. **No** meter aquí utilidades de una sola palabra (`flex`, `gap-2`) ni el CSS del kanban (`.kanban-*` en `globals.css`) sin hablarlo antes en equipo.

### Import de ejemplo

```tsx
import {
  Button,
  buttonClassName,
  EmptyState,
  Icon,
  uiStyles,
  cx,
} from '@/components/ui';
```

### Nota: librerías que **no** usamos (por si las veis en tutoriales)

En internet (sobre todo con shadcn/ui) veréis:

| Nombre | Qué es | ¿Lo tenemos? |
|--------|--------|--------------|
| **`clsx`** | Paquete npm que junta clases (como nuestro `cx`). | No. Usamos `cx` casero. |
| **`tailwind-merge`** | Paquete que, si pasas `p-2` y `p-4`, deja solo una. | No. Evitamos mezclar clases que peleen. |
| **CVA** (*class-variance-authority*) | Paquete para definir variantes tipadas (`primary` / `ghost`…). | No. Las variantes viven en `uiStyles.button` + props de `Button`. |

Si alguien propone instalarlas (u otro cambio de este sistema): se habla en equipo; hoy el front no las necesita.

---

*Última actualización: hub org en `/workspace/settings` (miembros + add-member UI); `/profile` + `profileApi`; `/security` → redirect; 2FA solo en `/settings` (sin contador de recovery codes en UI); gates `useRoles` org; BE pendiente: `POST …/members`, `PATCH /me`; friends TBD.*
