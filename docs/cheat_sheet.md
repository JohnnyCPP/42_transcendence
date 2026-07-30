# Cheat sheet del proyecto 

Referencia rápida de los comandos, APIs y funciones principales que se utilizan en este proyecto. 

## 1. npm y ciclo de desarrollo

Los scripts están definidos en [`package.json`](package.json).

### `npm install`

Instala las dependencias declaradas en `package.json`.

```bash
npm install
```

Se utiliza la primera vez que se descarga el proyecto o cuando cambian sus dependencias.

### `npm ci`

Instala exactamente las versiones guardadas en `package-lock.json`. Es más apropiado para integraciones continuas o instalaciones reproducibles.

```bash
npm ci
```

### `npm run dev`

Ejecuta TypeScript en modo observación. Vuelve a compilar cuando cambia un archivo de `src/`.

```bash
npm run dev
```

Internamente ejecuta:

```bash
tsc -w -p tsconfig.json
```

### `npm run build`

Genera el cliente Prisma y compila el backend TypeScript en `dist/`.

```bash
npm run build
```

Internamente:

```bash
prisma generate
tsc -p tsconfig.json
```

Debe ejecutarse después de modificar `src/` o `prisma/schema.prisma`.

### `npm start`

Arranca el JavaScript ya compilado.

```bash
npm start
```

Internamente:

```bash
node dist/server.js
```

Los cambios realizados únicamente en `public/` no requieren una nueva compilación.

### `npm test`

Genera el cliente Prisma y ejecuta todas las pruebas de integración.

```bash
npm test
```

Internamente:

```bash
prisma generate
node --test tests/integration/*.mjs
```

## 2. TypeScript

La configuración se encuentra en [`tsconfig.json`](tsconfig.json).

### `tsc -p`

Compila usando el archivo de configuración indicado.

```bash
tsc -p tsconfig.json
```

En este proyecto convierte `src/**/*.ts` en JavaScript dentro de `dist/`.

### `tsc -w`

Mantiene el compilador observando cambios.

```bash
tsc -w -p tsconfig.json
```

### Opciones utilizadas

| Opción | Función en el proyecto |
| --- | --- |
| `target: "ES2022"` | Genera JavaScript moderno compatible con Node.js. |
| `module: "NodeNext"` | Utiliza módulos ESM siguiendo las reglas de Node. |
| `moduleResolution: "NodeNext"` | Resuelve imports como lo hace Node con ESM. |
| `strict: true` | Activa las comprobaciones estrictas de tipos. |
| `esModuleInterop: true` | Facilita importar paquetes CommonJS. |
| `forceConsistentCasingInFileNames` | Evita diferencias de mayúsculas en imports. |
| `skipLibCheck: true` | No revisa internamente los tipos de dependencias. |
| `rootDir: "src"` | Define el origen del backend. |
| `outDir: "dist"` | Define el destino compilado. |

### `import type`

Importa únicamente información de tipos; desaparece al compilar.

```ts
import type { FastifyInstance } from 'fastify';
```

Se utiliza, por ejemplo, en [`src/ui/ui.routes.ts`](src/ui/ui.routes.ts).

### `interface`

Define el contrato que debe cumplir un objeto o clase.

```ts
export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(hash: string, password: string): Promise<boolean>;
}
```

Ejemplo en [`src/shared/crypto/passwordHasher.ts`](src/shared/crypto/passwordHasher.ts).

### `Omit<T, K>`

Crea un tipo quitando propiedades de otro.

```ts
Omit<Session, 'id' | 'createdAt' | 'lastSeenAt' | 'revokedAt'>
```

Se utiliza al crear sesiones en [`src/modules/sessions/sessions.prismaRepository.ts`](src/modules/sessions/sessions.prismaRepository.ts).

### `Awaited<ReturnType<...>>`

Obtiene el tipo final devuelto por una función asíncrona.

```ts
Awaited<ReturnType<PrismaClient['session']['findUnique']>>
```

Se usa para tipar filas Prisma en los métodos `map...`.

## 3. Variables de entorno y dotenv

La configuración está en [`src/config/env.ts`](src/config/env.ts) y el ejemplo en [`.env.example`](.env.example).

### `import 'dotenv/config'`

Lee automáticamente el archivo `.env` y añade sus valores a `process.env`.

```ts
import 'dotenv/config';
```

### `process.env`

Contiene las variables de entorno del proceso.

```ts
envSchema.parse(process.env);
```

El proyecto valida estas variables antes de arrancar.

Variables principales:

| Variable | Función |
| --- | --- |
| `NODE_ENV` | Selecciona `development`, `test` o `production`. |
| `HOST` | Dirección donde escucha Fastify. |
| `PORT` | Puerto HTTP. |
| `DATABASE_URL` | Conexión con PostgreSQL. |
| `COOKIE_SECURE` | Obliga a enviar la cookie mediante HTTPS. |
| `SESSION_COOKIE_NAME` | Nombre de la cookie de sesión. |
| `SESSION_TTL_DAYS` | Duración de una sesión. |
| `TOTP_ISSUER` | Nombre mostrado en la aplicación autenticadora. |
| `TOTP_ENCRYPTION_KEY_BASE64` | Clave usada para cifrar secretos TOTP. |

## 4. Fastify

Fastify construye el servidor HTTP. Su configuración principal está en [`src/app.ts`](src/app.ts).

### `Fastify(options)`

Crea la aplicación.

```ts
const app = Fastify({ logger: env.NODE_ENV !== 'test' });
```

El logger se desactiva durante las pruebas.

### `app.listen()`

Arranca el servidor HTTP.

```ts
await app.listen({
  host: env.HOST,
  port: env.PORT
});
```

Se utiliza en [`src/server.ts`](src/server.ts).

### `app.get()`

Registra una ruta HTTP `GET`.

```ts
app.get('/health', async () => ({ ok: true }));
```

Otros ejemplos son `GET /me`, `GET /organizations` y `GET /boards/:boardId`.

### `app.post()`

Registra una ruta HTTP `POST`.

```ts
app.post('/auth/login', async (request, reply) => {
  // ...
});
```

Se usa para crear recursos o ejecutar acciones: registro, login, creación de organizaciones, tableros y listas.

### `app.patch()`

Actualiza parcialmente un recurso.

```ts
app.patch('/boards/:boardId', { preHandler: requireAuth(sessionsService) }, async (request) => {
  // ...
});
```

Se utiliza para editar organizaciones, tableros y listas.

### `app.delete()`

Registra una eliminación.

```ts
app.delete('/2fa', { preHandler: requireAuth(sessionsService) }, async (request) => {
  // ...
});
```

En el proyecto desactiva el segundo factor.

### `preHandler`

Ejecuta una función antes del controlador principal.

```ts
{
  preHandler: requireAuth(sessionsService)
}
```

Se utiliza para bloquear rutas que requieren sesión.

También acepta varias comprobaciones:

```ts
{
  preHandler: [requireAuth(sessionsService), requireRole('admin')]
}
```

Ejemplo en `GET /admin/users`.

### `app.register()`

Instala un plugin de Fastify.

```ts
await app.register(cookie);
```

El plugin `@fastify/cookie` permite leer y escribir cookies.

### `app.addContentTypeParser()`

Personaliza cómo se interpreta un tipo de contenido.

```ts
app.addContentTypeParser(
  'application/json',
  { parseAs: 'string' },
  (_request, body, done) => {
    // ...
  }
);
```

En [`src/app.ts`](src/app.ts) permite convertir un cuerpo JSON vacío en `{}` para que Zod gestione la validación.

### `app.setErrorHandler()`

Define un manejador global de errores.

```ts
app.setErrorHandler((error, _request, reply) => {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      error: error.code,
      message: error.message
    });
  }
});
```

Convierte errores de dominio y de Zod en respuestas HTTP homogéneas.

### `app.addHook('onClose')`

Ejecuta código al cerrar Fastify.

```ts
app.addHook('onClose', async () => {
  await prisma.$disconnect();
});
```

Se usa para cerrar correctamente la conexión con PostgreSQL.

### `app.decorate()`

Añade una propiedad personalizada a Fastify.

```ts
app.decorate('testContext', {
  usersService,
  authService,
  sessionsService
});
```

El proyecto expone servicios internos solamente durante las pruebas.

### `request.body`

Contiene el cuerpo de la petición.

```ts
const body = registerSchema.parse(request.body);
```

### `request.params`

Contiene los parámetros dinámicos de la URL.

```ts
const params = z
  .object({ boardId: z.string().min(1) })
  .parse(request.params);
```

Para `/boards/:boardId`, `params.boardId` contiene el ID.

### `request.cookies`

Contiene las cookies interpretadas por `@fastify/cookie`.

```ts
const token = request.cookies[securityConfig.cookieName];
```

Se utiliza durante logout y autorización.

### `request.ip`

Obtiene la dirección IP de la petición.

```ts
ipAddress: request.ip
```

Se guarda junto a la sesión y los desafíos de login.

### `request.headers`

Permite leer cabeceras HTTP.

```ts
request.headers['user-agent']
```

### `reply.status()`

Establece el estado HTTP.

```ts
reply.status(400);
```

### `reply.send()`

Envía el cuerpo de la respuesta.

```ts
reply.status(500).send({
  error: 'INTERNAL_ERROR',
  message: 'Internal server error'
});
```

### `reply.header()`

Añade una cabecera.

```ts
reply.header('cache-control', 'no-store');
```

La UI evita que el navegador reutilice archivos antiguos.

### `reply.type()`

Define el `Content-Type`.

```ts
reply.type('text/html; charset=utf-8');
```

Se usa al servir HTML, CSS y JavaScript desde [`src/ui/ui.routes.ts`](src/ui/ui.routes.ts).

## 5. Cookies con `@fastify/cookie`

Las funciones auxiliares están en [`src/shared/http/cookies.ts`](src/shared/http/cookies.ts).

### `reply.setCookie()`

Crea la cookie de sesión.

```ts
reply.setCookie(securityConfig.cookieName, token, {
  httpOnly: true,
  secure: securityConfig.cookieSecure,
  sameSite: 'lax',
  path: '/',
  expires: expiresAt
});
```

Opciones utilizadas:

| Opción | Función |
| --- | --- |
| `httpOnly` | Impide acceder a la cookie desde JavaScript del navegador. |
| `secure` | Solo permite enviarla mediante HTTPS. |
| `sameSite: 'lax'` | Reduce el riesgo de peticiones CSRF externas. |
| `path: '/'` | La cookie se usa en toda la aplicación. |
| `expires` | Marca la fecha de caducidad. |

### `reply.clearCookie()`

Elimina la cookie.

```ts
reply.clearCookie(securityConfig.cookieName, { path: '/' });
```

Se ejecuta durante `POST /auth/logout`.

## 6. Zod

Zod valida variables de entorno, cuerpos HTTP y parámetros de ruta.

### `z.object()`

Define un objeto y sus propiedades.

```ts
const registerSchema = z.object({
  username: z.string().min(3).max(32),
  email: z.string().email().optional(),
  password: z.string().min(12)
});
```

Ejemplo en [`src/modules/auth/auth.routes.ts`](src/modules/auth/auth.routes.ts).

### `z.string()`

Exige que el valor sea texto.

```ts
name: z.string()
```

### `z.array()`

Exige un array.

```ts
listIds: z.array(z.string().min(1)).min(1)
```

Se utiliza al reordenar listas en [`src/modules/lists/lists.routes.ts`](src/modules/lists/lists.routes.ts).

### `.trim()`

Elimina espacios al principio y al final antes de continuar la validación.

```ts
name: z.string().trim().min(1).max(80)
```

### `.min()`

Define una longitud o valor mínimo.

```ts
password: z.string().min(12)
```

### `.max()`

Define una longitud máxima.

```ts
description: z.string().trim().max(500)
```

### `.email()`

Comprueba que el texto tenga formato de email.

```ts
email: z.string().email()
```

### `.url()`

Comprueba que el texto sea una URL.

```ts
DATABASE_URL: z.string().url().optional()
```

### `.optional()`

Permite que la propiedad no esté incluida.

```ts
email: z.string().email().optional()
```

### `.nullable()`

Permite que el valor sea `null`.

```ts
description: z.string().trim().max(500).optional().nullable()
```

### `z.enum()`

Restringe un valor a una lista concreta.

```ts
method: z.enum(['totp', 'recovery_code'])
```

### `z.coerce.number()`

Convierte un valor recibido como texto en número antes de validarlo.

```ts
PORT: z.coerce.number().int().positive().default(3000)
```

Es útil porque todas las variables de entorno llegan inicialmente como texto.

### `.int()`

Exige un número entero.

```ts
z.coerce.number().int()
```

### `.positive()`

Exige un número mayor que cero.

```ts
SESSION_TTL_DAYS: z.coerce.number().int().positive()
```

### `.default()`

Proporciona un valor cuando no se ha recibido ninguno.

```ts
HOST: z.string().default('127.0.0.1')
```

### `.transform()`

Transforma el valor después de validarlo.

```ts
z.enum(['true', 'false'])
  .transform((value) => value === 'true');
```

En el proyecto convierte `COOKIE_SECURE` de texto a booleano.

### `.parse()`

Valida y devuelve los datos tipados. Si son inválidos lanza `ZodError`.

```ts
const body = createBoardSchema.parse(request.body);
```

### `ZodError`

Clase de error generada por una validación fallida.

```ts
if (error instanceof ZodError) {
  return reply.status(400).send({
    error: 'VALIDATION_ERROR',
    message: 'Invalid request body'
  });
}
```

## 7. Prisma CLI

El esquema se encuentra en [`prisma/schema.prisma`](prisma/schema.prisma).

### `prisma generate`

Genera `@prisma/client` a partir del esquema.

```bash
npm run prisma:generate
```

Debe ejecutarse cuando cambia un modelo de `schema.prisma`.

### `prisma format`

Formatea el esquema Prisma.

```bash
npm run prisma:format
```

### `prisma validate`

Comprueba que el esquema y sus relaciones sean válidos.

```bash
npm run prisma:validate
```

### Nota sobre migraciones

El proyecto no utiliza `prisma migrate dev`. Ejecuta manualmente los archivos SQL de `db/migrations/` al arrancar mediante [`src/db/migrate.ts`](src/db/migrate.ts).

## 8. Esquema Prisma

### `generator client`

Configura la generación de `@prisma/client`.

```prisma
generator client {
  provider = "prisma-client-js"
}
```

### `datasource db`

Configura PostgreSQL y toma la conexión desde `DATABASE_URL`.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### `model`

Representa una entidad de la base de datos.

```prisma
model Board {
  id   String @id
  name String
}
```

### `@id`

Marca la clave primaria.

```prisma
id String @id
```

### `@unique`

Impide valores duplicados.

```prisma
username String @unique
```

### `@default()`

Define un valor inicial.

```prisma
role String @default("user")
```

### `@default(now())`

Guarda la fecha actual al crear el registro.

```prisma
createdAt DateTime @default(now())
```

### `@updatedAt`

Actualiza automáticamente la fecha cada vez que cambia la fila.

```prisma
updatedAt DateTime @updatedAt
```

### `@map()`

Relaciona un nombre TypeScript con el nombre real de una columna.

```prisma
createdAt DateTime @map("created_at")
```

### `@@map()`

Relaciona el modelo con el nombre real de una tabla.

```prisma
@@map("board_lists")
```

### `@relation()`

Define una relación.

```prisma
board Board @relation(
  fields: [boardId],
  references: [id],
  onDelete: Cascade
)
```

### `onDelete: Cascade`

Elimina los registros hijos al eliminar el padre. Por ejemplo, al eliminar un tablero se eliminan sus listas.

### `onDelete: Restrict`

Impide eliminar el registro padre si todavía está siendo utilizado.

### `@@index()`

Crea un índice para acelerar búsquedas.

```prisma
@@index([boardId])
```

### `@@id()`

Crea una clave primaria compuesta.

```prisma
@@id([organizationId, userId])
```

### `@@unique()`

Crea una restricción única compuesta.

```prisma
@@unique([boardId, position])
```

### `String?`, `DateTime?`

El símbolo `?` indica que la propiedad puede ser `null`.

```prisma
description String?
```

### `BoardList[]`

Los corchetes indican una relación de uno a muchos.

```prisma
lists BoardList[]
```

## 9. Prisma Client

Las implementaciones están en los archivos `*.prismaRepository.ts`.

### `new PrismaClient()`

Crea el cliente de base de datos.

```ts
return new PrismaClient();
```

Ejemplo en [`src/db/client.ts`](src/db/client.ts).

### `.create()`

Inserta una fila.

```ts
await this.prisma.user.create({
  data: {
    id: randomToken(16),
    username: input.username
  }
});
```

Se usa para usuarios, sesiones, credenciales, desafíos, tableros y listas.

### `.createMany()`

Inserta varias filas.

```ts
await this.prisma.recoveryCode.createMany({
  data: codeHashes.map((codeHash) => ({
    id: randomToken(16),
    userId,
    codeHash
  }))
});
```

Se utiliza al generar códigos de recuperación.

### `.findUnique()`

Busca mediante una clave primaria o única.

```ts
await this.prisma.user.findUnique({
  where: { username }
});
```

Se usa para usuarios, sesiones, credenciales, desafíos, TOTP y membresías.

### `.findFirst()`

Devuelve la primera fila que cumpla los filtros.

```ts
await this.prisma.board.findFirst({
  where: { id: boardId, archivedAt: null }
});
```

### `.findMany()`

Devuelve varias filas.

```ts
await this.prisma.boardList.findMany({
  where: { boardId, archivedAt: null },
  orderBy: { position: 'asc' }
});
```

### `.update()`

Actualiza una fila que debe existir.

```ts
await this.prisma.session.update({
  where: { id: sessionId },
  data: { reauthenticatedAt: new Date() }
});
```

### `.updateMany()`

Actualiza todas las filas que cumplan una condición y no falla si no encuentra ninguna.

```ts
await this.prisma.session.updateMany({
  where: { userId, revokedAt: null },
  data: { revokedAt: new Date() }
});
```

Se usa para revocar sesiones, consumir desafíos y marcar códigos de recuperación.

### `.deleteMany()`

Elimina las filas coincidentes.

```ts
await this.prisma.twoFactorTotp.deleteMany({
  where: { userId }
});
```

Se utiliza al desactivar 2FA.

### `.upsert()`

Actualiza si el registro existe o lo crea si no existe.

```ts
await this.prisma.twoFactorTotp.upsert({
  where: { userId },
  create: { id, userId, secretEncrypted },
  update: { secretEncrypted }
});
```

Se utiliza al iniciar la configuración TOTP.

### `$transaction(callback)`

Ejecuta varias operaciones como una unidad: o se completan todas o se deshacen todas.

```ts
await this.prisma.$transaction(async (tx) => {
  const organization = await tx.organization.create({ data });
  await tx.organizationMember.create({ data: ownerData });
  return organization;
});
```

Se utiliza al crear una organización y su propietario.

### `$transaction(array)`

Ejecuta una lista de operaciones en la misma transacción.

```ts
await this.prisma.$transaction([
  this.prisma.twoFactorTotp.deleteMany({ where: { userId } }),
  this.prisma.recoveryCode.updateMany({ /* ... */ })
]);
```

### `$executeRawUnsafe()`

Ejecuta SQL directamente.

```ts
await prisma.$executeRawUnsafe(statement);
```

Se utiliza en [`src/db/migrate.ts`](src/db/migrate.ts) con archivos SQL internos controlados por el proyecto. No debe recibir texto introducido por usuarios porque permitiría inyección SQL.

### `$disconnect()`

Cierra las conexiones de Prisma.

```ts
await prisma.$disconnect();
```

### Opciones de consulta usadas

| Opción | Función | Ejemplo del proyecto |
| --- | --- | --- |
| `where` | Filtra filas. | `{ where: { archivedAt: null } }` |
| `data` | Datos que se crean o modifican. | `{ data: { name: input.name } }` |
| `orderBy` | Ordena resultados. | `{ orderBy: { position: 'asc' } }` |
| `select` | Devuelve solo algunos campos. | `{ select: { position: true } }` |
| `include` | Incluye relaciones. | `{ include: { members: true } }` |
| `some` | Exige que alguna relación cumpla una condición. | `members: { some: { userId } }` |
| `not` | Excluye un valor. | `id: { not: keepSessionId }` |

### Error Prisma `P2002`

Indica una violación de una restricción única.

```ts
if (error.code === 'P2002') {
  throw conflict('User already exists');
}
```

Se transforma en un error HTTP `409`.

## 10. PostgreSQL y migraciones SQL

Las migraciones están en [`db/migrations/`](db/migrations/).

### `CREATE TABLE IF NOT EXISTS`

Crea una tabla solo si todavía no existe.

```sql
CREATE TABLE IF NOT EXISTS boards (
  id text PRIMARY KEY,
  name text NOT NULL
);
```

Hace que las migraciones puedan ejecutarse varias veces.

### `CREATE INDEX IF NOT EXISTS`

Crea un índice para acelerar búsquedas.

```sql
CREATE INDEX IF NOT EXISTS boards_organization_id_idx
  ON boards(organization_id);
```

### `DROP TABLE IF EXISTS`

Elimina una tabla únicamente si existe.

```sql
DROP TABLE IF EXISTS obsolete_table;
```

La migración de compatibilidad del proyecto lo utiliza para limpiar tablas de versiones anteriores.

### `PRIMARY KEY`

Identifica cada fila de forma única.

```sql
id text PRIMARY KEY
```

### `REFERENCES`

Crea una clave foránea.

```sql
board_id text NOT NULL REFERENCES boards(id)
```

### `ON DELETE CASCADE`

Elimina automáticamente los hijos cuando se elimina el padre.

```sql
REFERENCES boards(id) ON DELETE CASCADE
```

### `ON DELETE RESTRICT`

Impide eliminar un padre que todavía tenga referencias.

```sql
REFERENCES users(id) ON DELETE RESTRICT
```

### `UNIQUE`

Evita valores duplicados.

```sql
UNIQUE (board_id, position)
```

### `CHECK`

Limita los valores permitidos.

```sql
role text NOT NULL CHECK (role IN ('owner', 'admin', 'member'))
```

### `DEFAULT`

Define un valor inicial.

```sql
role text NOT NULL DEFAULT 'user'
```

### `now()`

Devuelve la fecha y hora actual de PostgreSQL.

```sql
created_at timestamptz NOT NULL DEFAULT now()
```

### Consultas manuales útiles

Abrir la consola PostgreSQL:

```bash
docker compose exec postgres psql -U postgres -d transcendence
```

Listar tablas:

```sql
\dt
```

Consultar usuarios:

```sql
SELECT * FROM users;
```

Consultar las listas con su tablero y organización:

```sql
SELECT
  o.name AS organization,
  b.name AS board,
  bl.name AS list,
  bl.position
FROM organizations o
JOIN boards b ON b.organization_id = o.id
JOIN board_lists bl ON bl.board_id = b.id
ORDER BY o.name, b.name, bl.position;
```

Salir:

```sql
\q
```

## 11. Docker Compose

La configuración está en [`docker-compose.yml`](docker-compose.yml).

### `docker compose up -d postgres`

Crea y arranca PostgreSQL en segundo plano.

```bash
docker compose up -d postgres
```

### `docker compose ps`

Muestra el estado del contenedor.

```bash
docker compose ps
```

### `docker compose logs postgres`

Muestra los logs de PostgreSQL.

```bash
docker compose logs postgres
```

### `docker compose stop postgres`

Detiene PostgreSQL sin borrar sus datos.

```bash
docker compose stop postgres
```

### `docker compose down`

Detiene y elimina el contenedor y su red. El volumen de datos se conserva.

```bash
docker compose down
```

No se debe añadir `-v` si se quiere conservar la base de datos.

### Volumen `postgres_data`

Guarda los datos fuera del contenedor:

```yaml
volumes:
  - postgres_data:/var/lib/postgresql/data
```

Por eso los datos sobreviven al apagar el servidor o recrear el contenedor.

## 12. Node.js: archivos y rutas

### `readFile()`

Lee un archivo de forma asíncrona.

```ts
const html = await readFile(join(publicDir, 'index.html'), 'utf8');
```

Se utiliza para servir la UI y leer migraciones.

### `readdir()`

Lista los archivos de un directorio.

```ts
const migrationFiles = await readdir(migrationsDir);
```

### `join()`

Construye una ruta compatible con el sistema operativo.

```ts
join(process.cwd(), 'db', 'migrations')
```

### `process.cwd()`

Devuelve el directorio desde el que se inició Node.

```ts
const publicDir = join(process.cwd(), 'public');
```

### `JSON.parse()`

Convierte texto JSON en un objeto.

```ts
JSON.parse(rawBody)
```

Se utiliza en el parser personalizado de Fastify.

## 13. Criptografía de Node.js

Los auxiliares están en [`src/shared/crypto/`](src/shared/crypto/).

### `randomBytes()`

Genera bytes aleatorios criptográficamente seguros.

```ts
randomBytes(32).toString('base64url');
```

La función `randomToken()` la utiliza para IDs, tokens de sesión y desafíos.

### `createHash('sha256')`

Crea un hash SHA-256.

```ts
createHash('sha256')
  .update(token)
  .digest('base64url');
```

La base de datos guarda el hash de los tokens, no el token original.

### `scrypt()`

Deriva una clave resistente a ataques de fuerza bruta a partir de una contraseña.

```ts
const derivedKey = await scrypt(password, salt, 64);
```

Se utiliza en [`src/shared/crypto/passwordHasher.ts`](src/shared/crypto/passwordHasher.ts).

### `promisify()`

Convierte una función basada en callback en una promesa.

```ts
const scrypt = promisify(nodeScrypt);
```

Así se puede usar `await scrypt(...)`.

### `timingSafeEqual()`

Compara dos buffers evitando que el tiempo de ejecución revele información.

```ts
timingSafeEqual(expectedKey, actualKey)
```

Se utiliza para verificar contraseñas y códigos de recuperación.

### `createCipheriv('aes-256-gcm')`

Crea un cifrador AES-256-GCM.

```ts
const cipher = createCipheriv('aes-256-gcm', key, iv);
```

Se utiliza para cifrar el secreto TOTP antes de guardarlo.

### `cipher.update()` y `cipher.final()`

Procesan y finalizan el cifrado.

```ts
Buffer.concat([
  cipher.update(plaintext, 'utf8'),
  cipher.final()
]);
```

### `cipher.getAuthTag()`

Obtiene la etiqueta de autenticación GCM necesaria para detectar modificaciones.

```ts
const tag = cipher.getAuthTag();
```

### `createDecipheriv()`

Crea el descifrador.

```ts
const decipher = createDecipheriv(
  'aes-256-gcm',
  key,
  iv
);
```

### `decipher.setAuthTag()`

Configura la etiqueta que autentica el texto cifrado.

```ts
decipher.setAuthTag(tag);
```

### `Buffer.from()`

Convierte texto o bytes a un `Buffer`.

```ts
Buffer.from(keyBase64, 'base64')
```

### `Buffer.concat()`

Une varios buffers.

```ts
Buffer.concat([cipher.update(...), cipher.final()])
```

## 14. TOTP con otplib

El servicio está en [`src/modules/two_factor/totp.service.ts`](src/modules/two_factor/totp.service.ts).

### `authenticator.generateSecret()`

Genera el secreto compartido entre el servidor y la aplicación autenticadora.

```ts
const secret = authenticator.generateSecret();
```

### `authenticator.keyuri()`

Crea la URI `otpauth://` que se puede importar en una aplicación autenticadora.

```ts
authenticator.keyuri(
  username,
  securityConfig.totpIssuer,
  secret
);
```

### `authenticator.check()`

Comprueba un código TOTP.

```ts
authenticator.check(code, secret);
```

La aplicación autenticadora y el backend calculan el mismo código utilizando el secreto y la hora actual.

### `authenticator.generate()`

Genera un código TOTP. El backend no lo necesita en producción, pero las pruebas lo usan para simular una aplicación autenticadora.

```js
authenticator.generate(secret)
```

Ejemplo en [`tests/integration/auth-flow.test.mjs`](tests/integration/auth-flow.test.mjs).

## 15. Errores HTTP propios

Los errores están en [`src/shared/errors/`](src/shared/errors/).

### `AppError`

Guarda mensaje, estado HTTP y código interno.

```ts
new AppError('Authentication required', 401, 'UNAUTHORIZED');
```

### Funciones disponibles

| Función | Estado | Uso |
| --- | ---: | --- |
| `badRequest()` | 400 | Petición inválida por reglas de negocio. |
| `unauthorized()` | 401 | Falta autenticación o credenciales válidas. |
| `forbidden()` | 403 | Usuario autenticado sin permisos suficientes. |
| `notFound()` | 404 | Recurso inexistente o no visible para el usuario. |
| `conflict()` | 409 | Conflicto con el estado actual o un valor único. |
| `tooManyRequests()` | 429 | Demasiados intentos. |

Ejemplo:

```ts
throw forbidden(
  'Recent reauthentication required',
  'REAUTHENTICATION_REQUIRED'
);
```

## 16. Autorización y sesiones

### `requireAuth()`

Lee la cookie, valida la sesión y coloca el usuario en la petición.

```ts
app.get('/me', {
  preHandler: requireAuth(sessionsService)
}, async (request) => ({
  user: request.currentUser
}));
```

Definida en [`src/modules/authorization/requireAuth.ts`](src/modules/authorization/requireAuth.ts).

### `requireRole()`

Comprueba el rol global del usuario.

```ts
preHandler: [
  requireAuth(sessionsService),
  requireRole('admin')
]
```

### `setSessionCookie()`

Guarda el token de sesión en el navegador.

```ts
setSessionCookie(reply, result.sessionToken, result.sessionExpiresAt);
```

### `clearSessionCookie()`

Elimina la cookie al cerrar sesión.

```ts
clearSessionCookie(reply);
```

### `hashToken()`

Convierte el token real en un hash antes de buscarlo o guardarlo.

```ts
const tokenHash = hashToken(sessionToken);
```

### `InMemoryRateLimiter.assertAllowed()`

Cuenta los intentos dentro de una ventana temporal.

```ts
this.passwordLimiter.assertAllowed(
  `${input.ipAddress ?? 'unknown'}:${input.username.toLowerCase()}`
);
```

Si se supera el máximo lanza un error `429`.

## 17. Módulos de dominio

Cada módulo sigue aproximadamente este flujo:

```text
ruta HTTP → servicio → repositorio → PostgreSQL
```

Durante las pruebas, el repositorio Prisma se sustituye por uno en memoria.

### Usuarios

Archivos: [`src/modules/users/`](src/modules/users/).

Funciones principales:

| Función | Qué hace |
| --- | --- |
| `createUser()` | Crea un usuario normalizando username y email. |
| `findById()` | Busca un usuario por ID. |
| `findByUsername()` | Busca por nombre de usuario. |
| `findByEmail()` | Busca por email. |
| `listUsers()` | Lista usuarios para la ruta administrativa. |

### Autenticación

Archivos: [`src/modules/auth/`](src/modules/auth/).

| Función | Qué hace |
| --- | --- |
| `register()` | Crea usuario, contraseña y sesión. |
| `login()` | Verifica contraseña e inicia sesión o solicita 2FA. |
| `completeTwoFactorLogin()` | Completa un desafío TOTP o de recuperación. |
| `reauthenticate()` | Confirma de nuevo la identidad para acciones sensibles. |
| `changePassword()` | Sustituye el hash de contraseña. |

### Sesiones

Archivos: [`src/modules/sessions/`](src/modules/sessions/).

| Función | Qué hace |
| --- | --- |
| `createSession()` | Genera un token, guarda su hash y devuelve la cookie. |
| `getSessionFromToken()` | Resuelve una sesión activa desde el token. |
| `revokeSession()` | Marca la sesión como revocada. |
| `revokeOtherUserSessions()` | Cierra el resto de sesiones del usuario. |
| `markReauthenticated()` | Guarda cuándo se volvió a confirmar la identidad. |

### Segundo factor

Archivos: [`src/modules/two_factor/`](src/modules/two_factor/).

| Función | Qué hace |
| --- | --- |
| `isEnabled()` | Comprueba si el usuario tiene TOTP activo. |
| `beginTotpSetup()` | Genera y cifra el secreto TOTP. |
| `confirmTotpSetup()` | Valida el primer código y genera recuperación. |
| `verifyTotp()` | Comprueba un código temporal de la aplicación autenticadora. |
| `consumeRecoveryCode()` | Comprueba y consume un código de recuperación. |
| `regenerateRecoveryCodes()` | Invalida los anteriores y crea otros nuevos. |
| `disableTwoFactor()` | Elimina TOTP e invalida recuperación. |
| `generateForUser()` | Genera códigos, guarda sus hashes y devuelve el texto una vez. |

### Organizaciones

Archivos: [`src/modules/organizations/`](src/modules/organizations/).

| Función | Qué hace |
| --- | --- |
| `createOrganization()` | Crea organización y asigna al creador como `owner`. |
| `listUserOrganizations()` | Lista solo organizaciones del usuario. |
| `getOrganizationForUser()` | Obtiene una organización comprobando membresía. |
| `updateOrganization()` | Cambia nombre o slug si el usuario puede administrarla. |
| `normalizeSlug()` | Convierte texto en un slug normalizado. |
| `canManageOrganization()` | Permite administrar a `owner` y `admin`. |

### Tableros

Archivos: [`src/modules/boards/`](src/modules/boards/).

| Función | Qué hace |
| --- | --- |
| `createBoard()` | Crea un tablero dentro de una organización accesible. |
| `listOrganizationBoards()` | Lista tableros activos de la organización. |
| `getBoardForUser()` | Obtiene el tablero y valida la membresía. |
| `updateBoard()` | Edita nombre o descripción. |

### Listas

Archivos: [`src/modules/lists/`](src/modules/lists/).

| Función | Qué hace |
| --- | --- |
| `createList()` | Crea una lista en el tablero seleccionado. |
| `listBoardLists()` | Devuelve listas activas ordenadas por posición. |
| `getListForUser()` | Busca una lista y comprueba acceso al tablero. |
| `updateList()` | Cambia el nombre de una lista. |
| `reorderLists()` | Asigna nuevas posiciones dentro de una transacción. |
| `assertSameListSet()` | Exige recibir todos los IDs activos exactamente una vez. |

Las posiciones usan saltos de 1000:

```text
To Do → 1000
Doing → 2000
Done → 3000
```

## 18. Pruebas con Node Test Runner

Las pruebas se encuentran en [`tests/integration/`](tests/integration/).

### `test()`

Define un caso de prueba.

```js
test('anonymous users cannot create boards', async () => {
  // ...
});
```

### `assert.equal()`

Compara con igualdad estricta.

```js
assert.equal(response.statusCode, 401);
```

### `assert.deepEqual()`

Compara objetos o arrays.

```js
assert.deepEqual(response.json(), { ok: true });
```

### `assert.ok()`

Comprueba que una expresión sea verdadera.

```js
assert.ok(response.headers['set-cookie']);
```

### `assert.match()`

Comprueba texto mediante una expresión regular.

```js
assert.match(html.payload, /Banco de pruebas/);
```

### `app.inject()`

Simula una petición HTTP sin abrir un puerto real.

```js
const response = await app.inject({
  method: 'POST',
  url: '/auth/login',
  payload: {
    username: 'alice',
    password: 'correct horse battery staple'
  }
});
```

### `response.statusCode`

Contiene el estado HTTP de la respuesta simulada.

```js
assert.equal(response.statusCode, 200);
```

### `response.json()`

Convierte el cuerpo JSON en un objeto.

```js
const data = response.json();
```

### `app.close()`

Cierra la aplicación y ejecuta los hooks `onClose`.

```js
await app.close();
```

## 19. JavaScript de la UI

La UI está en [`public/app.js`](public/app.js).

### `fetch()`

Realiza una petición HTTP desde el navegador.

```js
const response = await fetch('/organizations', {
  credentials: 'same-origin'
});
```

`credentials: 'same-origin'` permite enviar la cookie de sesión.

### `response.text()`

Lee el cuerpo de la respuesta como texto.

```js
const raw = await response.text();
```

Después se convierte a JSON cuando es posible.

### `FormData`

Lee los controles de un formulario.

```js
new FormData(form)
```

### `Object.fromEntries()`

Convierte las entradas del formulario en un objeto.

```js
Object.fromEntries(new FormData(form).entries())
```

### `document.getElementById()`

Busca un elemento por ID.

```js
document.getElementById('status')
```

### `document.querySelector()`

Busca el primer elemento que coincida con un selector CSS.

```js
document.querySelector('#loginForm input[name="username"]')
```

### `document.querySelectorAll()`

Busca varios elementos.

```js
document.querySelectorAll('.nav-button')
```

### `addEventListener()`

Escucha acciones del usuario.

```js
loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
});
```

### `event.preventDefault()`

Evita que el formulario recargue la página.

### `classList.add()`, `.remove()`

Cambian clases CSS.

```js
secondFactorForm.classList.remove('hidden');
```

### `replaceChildren()`

Elimina los hijos actuales de un elemento.

```js
organizationSelect.replaceChildren();
```

### `new Option()`

Crea una opción para un `<select>`.

```js
organizationSelect.add(
  new Option(organization.name, organization.id)
);
```

### `JSON.stringify()`

Convierte datos en texto JSON legible.

```js
JSON.stringify(workspace, null, 2)
```

### `structuredClone()`

Crea una copia profunda antes de ocultar contraseñas en el log.

```js
const clone = structuredClone(data);
```

### `performance.now()`

Mide la duración de cada petición.

```js
const startedAt = performance.now();
const duration = performance.now() - startedAt;
```

### `URL`

Interpreta la URI de aprovisionamiento TOTP.

```js
new URL(data.provisioningUri)
  .searchParams
  .get('secret');
```

### Métodos de arrays usados

| Método | Uso en la UI |
| --- | --- |
| `.find()` | Localizar la organización o tablero seleccionado. |
| `.some()` | Comprobar que la selección aún existe. |
| `.push()` | Añadir listas al estado. |
| `.sort()` | Ordenar listas por posición. |
| `.forEach()` | Registrar eventos en botones de navegación. |

## 20. API HTTP del proyecto

### Estado y usuario

```http
GET /health
GET /me
GET /admin/users
```

### Autenticación

```http
POST /auth/register
POST /auth/login
POST /auth/login/2fa
POST /auth/logout
POST /auth/reauthenticate
POST /auth/password/change
```

### Segundo factor

```http
POST   /2fa/setup
POST   /2fa/confirm
POST   /2fa/recovery-codes/regenerate
DELETE /2fa
```

### Organizaciones

```http
POST  /organizations
GET   /organizations
GET   /organizations/:organizationId
PATCH /organizations/:organizationId
```

### Tableros

```http
POST  /organizations/:organizationId/boards
GET   /organizations/:organizationId/boards
GET   /boards/:boardId
PATCH /boards/:boardId
```

### Listas

```http
POST  /boards/:boardId/lists
GET   /boards/:boardId/lists
PATCH /lists/:listId
POST  /boards/:boardId/lists/reorder
```

## 21. Orden habitual para ejecutar el proyecto

Primera instalación:

```bash
npm install
docker compose up -d postgres
npm run build
npm start
```

Después de cambiar el backend:

```bash
npm run build
npm test
npm start
```

Después de cambiar únicamente la UI:

```bash
# Si el servidor está apagado:
npm start

# Si ya está ejecutándose:
# basta con recargar el navegador.
```

Abrir:

```text
http://127.0.0.1:3000/
```
