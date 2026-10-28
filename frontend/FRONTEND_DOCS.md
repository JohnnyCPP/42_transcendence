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
| **Mock** | Datos inventados en el front para demos (p. ej. columnas del kanban) mientras no hay API. |
| **Endpoint** | URL concreta del backend que hace una acción (`POST /auth/login`, `GET /organizations`). |
| **Rewrite / proxy** | El front llama a `/api/...` y Next **reenvía** esa petición al backend. Evita problemas de CORS en local. |
| **CORS** | Regla del navegador que bloquea peticiones entre orígenes distintos (p. ej. `:3000` → `:4000`) si el servidor no lo permite. El proxy de Next evita pelear con eso en dev. |
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
│   └── ui/              # Primitivos + ui.styles.ts (Button, EmptyState…)
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

### `ui/` — primitivos y estilos compartidos
- `ui.styles.ts` — constantes Tailwind (`uiStyles`) + helper `cx` (ver §17).
- `Button` (+ `buttonClassName` para Links) — variantes primary / secondary / ghost / danger.
- `Icon` — Material Symbols Outlined con tamaños sm–xl.
- `EmptyState` — panel dashed (loading / error / vacío).
- `AuthCard` — shell + card de páginas auth / marketing.
- `TextInput` — input controlado con label/error.
- `Dialog`, `InfoDialog`, `ConfirmDialog`, `TextInputDialog` — modales (footers con `Button`).
- `index.ts` — barrel: `import { Button, uiStyles } from '@/components/ui'`.

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

Tomadas por **gsoteldo** para el frontend. Si alguien propone otra aproximación, se discute en equipo y luego se aplica (o no).

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

### G) Estilos: constantes + componentes
Si la misma cadena Tailwind se copia **más de dos veces**, se saca a `ui.styles.ts` y, si además hay markup reutilizable, a un componente en `components/ui/` (ver §17).  
No hay librerías extra de clases: solo el helper `cx`.

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
- Miembros / invites de org si el subject lo exige
- `API_BASE = '/api/v1'` cuando el backend versionado
- Tests de auth / utils kanban
- Limpiar mocks muertos (`mockDashboardBoards`, `localProjects`) si ya no se usan

---

## 14. Cómo orientarte si entras nuevo

1. Lee este doc (§5 nombres + §10 auth/workspace + §17 estilos UI).
2. Arranca front + back; prueba login → `/workspace` → dashboard → board → logout → F5 mantiene workspace.
3. `app/layout.tsx` → providers; páginas de producto → `ProtectedRoute` + `RequireActiveOrg` + `AppShell`.
4. Auth: `components/auth/`. Workspace: `components/org/` + `app/workspace/`.
5. Boards listado: `components/boards/`. Kanban: `components/board/` + `app/boards/[boardId]/`.
6. HTTP: `lib/apiClient.ts`.
7. UI reutilizable: `components/ui/` (`Button`, `EmptyState`, `uiStyles`…).

---

## 15. Frase corta para defensa oral

> Frontend por dominio, con AppShell, auth real por cookie HttpOnly, OrgProvider (workspace en UI) con org activa persistida en localStorage, y boards listados/creados vía API filtrados por esa org. Estilos repetidos viven en `uiStyles` + primitivos (`Button`, `EmptyState`…). El kanban de listas/cards sigue mock hasta conectar esos endpoints.

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
| Tokens / kanban CSS | `app/globals.css` |
| Estilos UI reutilizados | `components/ui/ui.styles.ts` + §17 |
| Primitivos UI | `components/ui/` (`Button`, `Icon`, `EmptyState`, `AuthCard`, dialogs…) |

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
| `dropdownItem` / `dropdownItemDanger` | Filas del menú ⋮ en columnas/tarjetas del kanban |

### Dónde se consume hoy

| Área | Qué usa |
|------|---------|
| Dialogs | `Button`, `TextInput`, `Icon` |
| Login / signup / forgot-password / projects/new / 404 | `AuthCard`, `Button` / `buttonClassName`, `TextInput`, `uiStyles` |
| boards / dashboard / workspace | `EmptyState`, `pageContent` / kicker / title / lead |
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

*Última actualización: glosario ampliado (§2); §17 explica `uiStyles`, `cx`, componentes UI y librerías que no usamos; BoardsProvider en layout (Auth → Org → Boards).*
