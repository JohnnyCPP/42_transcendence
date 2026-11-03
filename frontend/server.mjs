/**
 * Servidor HTTPS que ejecuta la app de Next.js.
 *
 * next start no sirve HTTPS, así que este servidor carga el certificado,
 * termina TLS y entrega cada petición a Next.js. Comprueba antes las
 * variables obligatorias y se cierra limpio con docker compose down.
 */

import { readFileSync } from 'node:fs';
import { createServer } from 'node:https';
import next from 'next';

const REQUIRED_ENV = ['HTTPS_CERT_PATH', 'HTTPS_KEY_PATH', 'INTERNAL_API_URL'];
const missing = REQUIRED_ENV.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(`[server] Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const host = process.env.HOST ?? '0.0.0.0';
const port = Number(process.env.PORT ?? 3000);

let tls;
try {
  tls = {
    cert: readFileSync(process.env.HTTPS_CERT_PATH),
    key: readFileSync(process.env.HTTPS_KEY_PATH)
  };
} catch (error) {
  console.error(`[server] Cannot read the TLS certificate or key: ${error.message}`);
  process.exit(1);
}

const app = next({ dev: false, hostname: host, port });
const handle = app.getRequestHandler();
await app.prepare();

const server = createServer(tls, (req, res) => handle(req, res));
server.listen(port, host, () => {
  console.log(`[server] HTTPS ready on https://${host}:${port} (API proxied to ${process.env.INTERNAL_API_URL})`);
});

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
