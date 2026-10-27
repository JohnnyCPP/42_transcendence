# Frontend — documentación del equipo

Documento interno para cualquiera del proyecto (también si no has tocado Next.js ni esta rama).  
No forma parte del entregable funcional; sirve para onboarding, handoff y defensa.

---

## 1. ¿Qué es esta carpeta?

`frontend/` es la **interfaz web** de TaskFlow (proyecto tipo tablero Kanban / 42 Transcendence).

- El usuario abre el navegador → ve pantallas (login, dashboard, tablero…).
- Parte de esas pantallas ya habla con el **backend** (servidor en otro puerto).
- El kanban (listas/cards) todavía usa **mocks** hasta conectar esos endpoints.

En una frase: **Next.js pinta la UI; el backend guarda usuarios, sesión, workspaces (orgs) y boards.**

---

## 2. Conceptos rápidos (sin asumir Next.js)

| Idea | Qué significa aquí |
|------|-------------------|
| **Página / ruta** | Una URL. Ejemplo: `/login`, `/dashboard`. En Next viven en `app/.../page.tsx`. |
| **Componente** | Pieza de UI reutilizable (botón, header, formulario…). Carpeta `components/`. |
| **Hook** | Función React que da estado o lógica (`useAuth`, `useOrg`, `useBoards`…). |
| **Provider / Context** | “Caja” que guarda un estado **una sola vez** y lo comparte con toda la app (auth, org/workspace activo). |
| **Cookie HttpOnly** | El backend deja una cookie de sesión que el JS no lee a mano; el navegador la manda solo. Más seguro que guardar el token en `localStorage`. |
| **Mock** | Datos inventados en el front para demos (p. ej. columnas del kanban). |
| **Rewrite / proxy** | El front llama a `/api/...` y Next reenvía esa petición al backend. Así evitáis problemas de CORS en local. |

### App Router (lo mínimo)

Next.js 16 usa carpetas bajo `app/`:

- `app/login/page.tsx` → URL `/login`
- `app/layout.tsx` → envoltorio de **todas** las páginas (fuentes, `AuthProvider` + `OrgProvider`, etc.)

No hace falta saber más para orientarte en el repo.

---

## 3. Cómo arrancar (local)

Desde la carpeta `frontend/`:

```bash
npm install
npm run dev
```

Por defecto la UI suele estar en `http://localhost:3000`.

**Importante:** para login/registro y boards reales necesitas el **backend** levantado (por defecto `http://localhost:4000`).  
Si el backend no está, las llamadas a `/api/...` fallarán.

Variable opcional (si el backend no está en el puerto 4000):

- `BACKEND_URL` — la usa `next.config.ts` en el rewrite.

Scripts útiles (`package.json`):

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Desarrollo con recarga |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build |
| `npm run lint` | ESLint |

---

## 4. Stack

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript** (`strict`)
- **Tailwind CSS v4** + tokens en `app/globals.css`
- Alias de imports: `@/` → raíz del frontend (`tsconfig.json`)

Ejemplo: `import { useAuth } from '@/components/auth'`  
es lo mismo que importar desde `frontend/components/auth`.

---

## 5. Modelo de dominio en la UI

```
Usuario
  └── Workspace (= organization en API/código)
        └── Boards / tableros
              └── Listas → Cards (kanban; aún mock)
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
├── data/                # Mocks de apoyo (kanban, demos)
├── lib/                 # Utilidades compartidas (apiClient)
├── types/               # Tipos compartidos (ej. board / filtros kanban)
├── next.config.ts       # Proxy /api → backend
└── FRONTEND_DOCS.md     # Este documento
```

Convención: hooks y utils van **junto a la feature** (`kanbanBoard/`, `taskModal/…`), no en una carpeta global `hooks/`.

---

## 7. Rutas de la aplicación (`app/`)

| URL | Archivo | Qué es hoy |
|-----|---------|------------|
| `/` | `app/page.tsx` | Redirige a `/dashboard`. |
| `/dashboard` | `app/dashboard/page.tsx` | Resumen + boards de la org activa (API). **Protegida** + `RequireActiveOrg`. |
| `/workspace` | `app/workspace/page.tsx` | Switcher/crear workspace (`useOrg`). **Protegida**. |
| `/boards` | `app/boards/page.tsx` | Listado de tableros de la org activa (API). **Protegida** + `RequireActiveOrg`. |
| `/boards/[boardId]` | `app/boards/[boardId]/` | Kanban de un board (listas/cards mock). **Protegida** + `RequireActiveOrg`. |
| `/projects/new` | `app/projects/new/page.tsx` | Crear board vía `POST .../boards`. **Protegida** + `RequireActiveOrg`. |
| `/login` | `app/login/page.tsx` | Login real (backend). Pública. |
| `/signup` | `app/signup/page.tsx` | Registro real (backend). Pública. |
| `/forgot-password` | `app/forgot-password/page.tsx` | Placeholder (no hay API aún). Pública. |
| `/privacy` | `app/privacy/page.tsx` | Política de privacidad (mandatory). Pública. |
| `/terms` | `app/terms/page.tsx` | Términos de servicio (mandatory). Pública. |
| *(cualquier ruta inválida)* | `app/not-found.tsx` | Página 404. |

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
- `Header.tsx` + `header/` — búsqueda, notificaciones, perfil/logout.
- `Sidebar.tsx` + `sidebar/` — logo (nombre del workspace activo), nav Panel / Workspace / Tableros, CTA “Crear proyecto”.
- `LegalLinks.tsx` / `LegalDocumentLayout.tsx` — Privacy y Terms.

### `org/` — organization (= workspace en UI)
- `OrgProvider.tsx` + `useOrg.ts` — carga `GET /organizations`, crea si vacío, reparte org activa.
- Persistencia: `localStorage` clave `taskflow.activeOrganizationId` (ver §10).
- `RequireActiveOrg.tsx` — guardia de workspace activo (paralela a `ProtectedRoute`).
- `OrganizationCard.tsx` / `CreateOrganizationForm.tsx` — UI del switcher.
- `org.types.ts` + `index.ts` — tipos y barrel (documenta la convención de nombres).

### `boards/` — listado / fetch de tableros (plural)
- `BoardsProvider.tsx` + `useBoards.ts` — estado compartido; `GET` + `createBoard` (`POST`) según org activa.
- `mapBoardToCard.ts` — adapta `Board` del API → props de `BoardCard`.
- `board.types.ts` / `boards.types.ts` — tipos alineados al backend.

### `board/` — Kanban (singular)
- `kanbanBoard/` — orquestador + estado + handlers + utils.
- `kanbanColumn/`, `taskModal/`, `boardHeader/`, `taskCard/`.

### `dashboard/`
- Barrel `index.ts` + `dashboard.types.ts`.
- `DashboardHero`, `BoardCard`, `ActivityFeed`, `VelocityWidget`.

### `ui/`
- `Dialog`, `InfoDialog`, `ConfirmDialog`, `TextInputDialog`, `TextInput` + `index.ts`.

---

## 9. Cómo habla el front con el backend

1. Las llamadas pasan por `lib/apiClient.ts` → `apiFetch` (cookies + JSON + errores unificados).
2. El código llama rutas relativas; `apiFetch` antepone `API_BASE` (`/api` hoy).
3. Para versionar: cambia `API_BASE` a `/api/v1` y el rewrite de `next.config.ts`.
4. Next reescribe `/api/:path*` → `BACKEND_URL/:path*`.
5. Login/register dejan cookie HttpOnly; el resto de peticiones la llevan solas.

| Acción | Método | Path en código | URL final en navegador |
|--------|--------|----------------|------------------------|
| Sesión actual | `GET` | `/me` | `/api/me` |
| Login | `POST` | `/auth/login` | `/api/auth/login` |
| Registro | `POST` | `/auth/register` | `/api/auth/register` |
| Logout | `POST` | `/auth/logout` | `/api/auth/logout` |
| Listar orgs | `GET` | `/organizations` | `/api/organizations` |
| Crear org | `POST` | `/organizations` | `/api/organizations` |
| Listar boards | `GET` | `/organizations/:orgId/boards` | `/api/organizations/:orgId/boards` |
| Crear board | `POST` | `/organizations/:orgId/boards` | `/api/organizations/:orgId/boards` |
| Obtener board | `GET` | `/boards/:boardId` | `/api/boards/:boardId` |

Body auth: `username` + `password` (+ `email` opcional en register). **Sin JWT en localStorage.**

---

## 10. Autenticación + workspace activo

### Piezas
1. En `app/layout.tsx`: `AuthProvider` → `OrgProvider` → `BoardsProvider`.
2. `AuthProvider` al montar llama a `GET /api/me`. Empieza con `isLoading: true` y `isAuthenticated: false`.
3. `OrgProvider` **espera** a `!isAuthLoading` antes de cargar orgs o limpiar storage.
4. Si hay sesión → `GET /organizations`; si la lista está vacía, crea una org por defecto.
5. Restaura `activeOrganization` desde `localStorage` (`taskflow.activeOrganizationId`) si el id sigue en la lista; si no, usa la primera.
6. Elegir/crear workspace escribe el id en storage; logout (auth ya resuelta y sin sesión) lo borra.
7. `BoardsProvider` carga/crea tableros de la org activa (`useBoards`).
8. `ProtectedRoute` + `RequireActiveOrg` en páginas de producto.
9. Login / signup actualizan auth y redirigen (p. ej. al dashboard).
10. Header → `logout()` → `/login`.

### Por qué esperar a `isAuthLoading`
Si al montar se tratara `isAuthenticated === false` como “logout real”, se borraría el id del workspace en **cada F5** antes de recuperar la cookie. Por eso el effect de org no limpia storage mientras auth sigue cargando.

### Flujo mental
```
Usuario abre /dashboard
  → ProtectedRoute (sesión)
  → RequireActiveOrg (workspace activo)
  → useBoards (BoardsProvider) lee activeOrganization.id
  → GET /organizations/:id/boards
```

### Archivos clave
- `components/auth/AuthProvider.tsx`, `useAuth.ts`, `ProtectedRoute.tsx`
- `components/org/OrgProvider.tsx`, `useOrg.ts`, `RequireActiveOrg.tsx`
- `app/workspace/page.tsx`
- `components/boards/BoardsProvider.tsx`, `useBoards.ts`

---

## 11. Decisiones de diseño del código (para defensa)

### A) Por dominio, no por “tipo de archivo”
Auth junto a auth, kanban junto a kanban, boards (listado) separado de board (kanban).

### B) Separar presentación / estado / utils
Ejemplo kanban: orquestador + hooks de estado/handlers + utils puras.  
Auth login/signup: contenedor + vista + formulario.

### C) Mock → real por etapas
Auth, orgs/workspace y **listado/creación de boards** ya van al API.  
Listas/cards del kanban siguen mock.

### D) Layout compuesto
`AppShell` + `header/` + `sidebar/`.

### E) Cliente HTTP único
`lib/apiClient.ts` para auth, orgs y boards.

### F) UI “workspace” / código “organization”
Misma entidad; nombres distintos por capa (ver §5).

---

## 12. Kanban (resumen)

- Ruta: `/boards/[boardId]` (`BoardPageClient` + `AppShell`).
- Datos de columnas/tareas: `data/mockBoardData.ts` (mismo mock por id de momento).
- Orquestador: `components/board/kanbanBoard/KanbanBoard.tsx`.
- Las tareas **no se persisten** en backend hasta API de lists/cards.

---

## 13. Estado actual (honestidad para el equipo)

### Ya conectado al backend
- Login, registro, logout, `/me`
- Organizations: listar, crear, org activa (persistida en `localStorage`)
- Boards: listar por org, crear desde `/projects/new`

### Funcional en UI (mock o sin API)
- Kanban (listas/cards) en `/boards/[boardId]`
- Widgets de actividad / velocidad del dashboard
- Forgot-password (solo pantalla)
- Privacy, Terms, 404

### Pendiente (cuando el contrato lo permita)
- Lists / cards reales del kanban
- Deduplicar UI dashboard ↔ `/boards` (EmptyState / BoardsGrid)
- Miembros / invites de org si el subject lo exige
- `API_BASE = '/api/v1'` cuando el backend versionado
- Tests de auth / utils kanban
- Limpiar mocks muertos (`mockDashboardBoards`, `localProjects`) si ya no se usan

---

## 14. Cómo orientarte si entras nuevo

1. Lee este doc (§5 nombres + §10 auth/workspace).
2. Arranca front + back; prueba login → `/workspace` → dashboard → board → logout → F5 mantiene workspace.
3. `app/layout.tsx` → providers; páginas de producto → `ProtectedRoute` + `RequireActiveOrg` + `AppShell`.
4. Auth: `components/auth/`. Workspace: `components/org/` + `app/workspace/`.
5. Boards listado: `components/boards/`. Kanban: `components/board/` + `app/boards/[boardId]/`.
6. HTTP: `lib/apiClient.ts`.

---

## 15. Frase corta para defensa oral

> Frontend por dominio, con AppShell, auth real por cookie HttpOnly, OrgProvider (workspace en UI) con org activa persistida en localStorage, y boards listados/creados vía API filtrados por esa org. El kanban de listas/cards sigue mock hasta conectar esos endpoints.

---

## 16. Índice rápido de archivos

| Tema | Dónde mirar |
|------|-------------|
| Layout raíz / providers | `app/layout.tsx` |
| Shell autenticado | `components/layout/AppShell.tsx` |
| Header / Sidebar | `components/layout/Header.tsx`, `header/`, `Sidebar.tsx`, `sidebar/` |
| Cliente API | `lib/apiClient.ts` |
| Proxy | `next.config.ts` |
| Auth | `AuthProvider.tsx`, `useAuth.ts`, `ProtectedRoute.tsx`, `login/`, `signup/` |
| Workspace (org) | `OrgProvider.tsx`, `useOrg.ts`, `RequireActiveOrg.tsx`, `app/workspace/page.tsx` |
| Boards (listado API) | `BoardsProvider.tsx`, `useBoards.ts`, `app/boards/page.tsx`, `app/dashboard/page.tsx` |
| Crear board | `BoardsProvider.createBoard`, `app/projects/new/page.tsx` |
| Kanban | `app/boards/[boardId]/`, `components/board/` |
| Legal / 404 | `app/privacy/`, `app/terms/`, `app/not-found.tsx` |
| Mocks kanban | `data/mockBoardData.ts` |
| Estilos | `app/globals.css` |

---

*Última actualización: BoardsProvider + useBoards en layout (Auth → Org → Boards); createBoard desde el provider; workspace UI = organization en API.*
