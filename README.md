# Transcendence Backend

Backend modular para una aplicacion de gestion de trabajo estilo Trello. El proyecto combina autenticacion segura, gestion de organizaciones, tableros y listas, con una pequeña interfaz web para probar manualmente los flujos principales.

En la carpeta docs hay imagenes que explican el flujo y una cheet_sheet  

Nuevo posible ejemplo de estructura

## Modulos principales:

| Módulo                 |  Puntos |

-Framework frontend y backend | 2 |

-Tiempo real con WebSockets   | 2 |

-Sistema de organizaciones    | 2 |

-Permisos avanzados           | 2 |

-API pública asegurada        | 2 |

-ORM con Prisma               | 1 |

-2FA completo                 | 1 |

-Notificaciones completas     | 1 |

-Colaboración en tiempo real  | 1 |

**Total asegurado**        | **14** |

## Modulos de reserva

-Módulo                  | Puntos |

-Búsqueda avanzada            | 1 |

-PWA con soporte offline      | 1 |

**Total potencial**        | **16** |








## Estado actual

Actualmente estan implementados:

- Registro e inicio de sesion con usuario, email opcional y contraseña.
- Sesiones mediante cookie `HttpOnly`, con expiracion y revocacion.
- Reautenticacion para operaciones sensibles.
- Autenticacion de dos factores mediante TOTP.
- Codigos de recuperacion de un solo uso.
- Organizaciones con roles `owner`, `admin` y `member`.
- Tableros asociados a organizaciones.
- Listas de tablero, edicion y reordenacion.
- Autorizacion por sesion, rol y pertenencia a la organizacion.
- Validacion de cuerpos y parametros con Zod.
- Migraciones SQL idempotentes ejecutadas al arrancar con PostgreSQL.
- Pruebas de integracion para autenticacion, organizaciones, tableros, listas e interfaz.

La interfaz incluida en `public/` es una UI de pruebas manuales,

## Tecnologias

- Node.js con modulos ESM.
- TypeScript en modo estricto.
- Fastify .
- PostgreSQL 16 mediante Docker Compose.
- Prisma 6 como cliente y generador de tipos.
- Zod para validacion.
- `otplib` para TOTP.
- `scrypt` de Node.js para contraseñas.
- Node Test Runner para las pruebas de integracion.

## Arquitectura

El codigo esta organizado por modulos de dominio:

```text
src/
├── app.ts                 # Construccion de Fastify y registro de modulos
├── server.ts              # Punto de entrada del servidor
├── config/                # Configuracion y seguridad
├── db/                    # Cliente Prisma y migraciones
├── modules/
│   ├── auth/              # Registro, login, logout y contraseñas
│   ├── authorization/     # Sesion actual y control de roles
│   ├── lists/             # Listas y reordenacion
│   ├── organizations/     # Organizaciones y membresias
│   ├── boards/            # Tableros
│   ├── sessions/          # Sesiones persistentes
│   ├── two_factor/        # TOTP y codigos de recuperacion
│   └── users/             # Usuarios y rutas administrativas
├── shared/                # Criptografia, cookies, errores y rate limiting
└── ui/                    # Rutas de la interfaz manual
```

Cada modulo separa rutas, servicios, tipos y repositorios. Los servicios reciben repositorios, por lo que la aplicacion utiliza implementaciones Prisma en desarrollo/produccion y en memoria cuando `NODE_ENV=test`.

## Requisitos

- Node.js compatible con TypeScript 5.9 y Prisma 6.
- npm.
- Docker y Docker Compose si se quiere ejecutar con PostgreSQL.

## Instalacion y configuracion

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Copiar `.env.example` a `.env` y completar al menos una clave para TOTP:

   ```bash
   TOTP_ENCRYPTION_KEY_BASE64=<32 bytes aleatorios codificados en base64>
   ```

3. Arrancar PostgreSQL:

   ```bash
   docker compose up -d postgres
   ```

4. Generar el cliente Prisma y compilar:

   ```bash
   npm run build
   ```

5. Iniciar el servidor:

   ```bash
   npm start
   ```

Por defecto queda disponible en `http://127.0.0.1:3000`. Las migraciones de `db/migrations/` se ejecutan automaticamente durante el arranque cuando existe `DATABASE_URL`.

## Variables de entorno

| Variable | Uso | Valor habitual |
| --- | --- | --- |
| `NODE_ENV` | Entorno de ejecucion | `development`, `test` o `production` |
| `HOST` / `PORT` | Interfaz y puerto HTTP | `127.0.0.1` / `3000` |
| `DATABASE_URL` | Conexion PostgreSQL | `postgres://postgres:postgres@127.0.0.1:5432/transcendence` |
| `COOKIE_SECURE` | Cookies solo por HTTPS | `false` en local |
| `SESSION_COOKIE_NAME` | Nombre de la cookie de sesion | `sid` |
| `SESSION_TTL_DAYS` | Duracion de sesion | `14` |
| `TOTP_ISSUER` | Emisor mostrado por la app TOTP | `Transcendence` |
| `TOTP_ENCRYPTION_KEY_BASE64` | Cifrado de secretos TOTP | Obligatoria |

En tests se omite `DATABASE_URL` y se utilizan repositorios en memoria.

## Scripts disponibles

```bash
npm run dev              # Compilacion incremental en modo watch
npm run build            # Prisma generate + compilacion TypeScript
npm start                # Arranca dist/server.js
npm test                 # Genera Prisma y ejecuta pruebas de integracion
npm run prisma:generate  # Regenera el cliente Prisma
npm run prisma:format    # Formatea el schema Prisma
npm run prisma:validate  # Valida el schema Prisma
```

## API principal

Todas las rutas protegidas utilizan la cookie de sesion configurada en `SESSION_COOKIE_NAME`.

### Salud y usuario

- `GET /health`
- `GET /me`
- `GET /admin/users` — requiere rol `admin`.

### Autenticacion

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/login/2fa`
- `POST /auth/logout`
- `POST /auth/reauthenticate`
- `POST /auth/password/change`

Las contraseñas nuevas deben tener al menos 12 caracteres. Las operaciones sensibles requieren una reautenticacion reciente.

### Segundo factor

- `POST /2fa/setup`
- `POST /2fa/confirm`
- `POST /2fa/recovery-codes/regenerate`
- `DELETE /2fa`

### Organizaciones, tableros y listas

- `POST /organizations`
- `GET /organizations`
- `GET /organizations/:organizationId`
- `PATCH /organizations/:organizationId`
- `POST /organizations/:organizationId/boards`
- `GET /organizations/:organizationId/boards`
- `GET /boards/:boardId`
- `PATCH /boards/:boardId`
- `POST /boards/:boardId/lists`
- `GET /boards/:boardId/lists`
- `PATCH /lists/:listId`
- `POST /boards/:boardId/lists/reorder`

Los servicios verifican que el usuario pertenece a la organizacion antes de permitir el acceso a sus tableros y listas. Las listas activas se reordenan enviando todos sus IDs exactamente una vez.

## Persistencia

El esquema se define en `prisma/schema.prisma`. Cuatro migraciones SQL ordenadas definen las tablas activas:

1. `001_auth_base.sql`: usuarios, credenciales, sesiones, 2FA y codigos de recuperacion.
2. `002_trello_core.sql`: organizaciones y membresias.
3. `003_trello_boards.sql`: tableros.
4. `004_trello_lists.sql`: listas y posiciones.


Los secretos de sesion y los codigos de recuperacion se almacenan mediante hashes. El secreto TOTP se cifra antes de persistirse.

## Interfaz manual

Con el servidor ejecutandose, abrir `http://127.0.0.1:3000/`. La UI permite probar registro, login, sesiones, reautenticacion, TOTP, organizaciones, tableros y listas. El panel lateral de actividad registra cada accion con su metodo, ruta, estado HTTP, duracion, peticion y respuesta.

## Manejo de errores

Las respuestas de error siguen una forma comun:

```json
{
  "error": "ERROR_CODE",
  "message": "Human readable message"
}
```

Los errores de validacion devuelven `400`, la falta de autenticacion `401`, los permisos insuficientes `403`, los conflictos de dominio `409` y los errores inesperados `500`.


