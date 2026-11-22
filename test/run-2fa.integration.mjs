// Runs the 2FA integration suite against an isolated disposable PostgreSQL container.
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const container = `taskflow-2fa-test-${randomBytes(6).toString('hex')}`;
let started = false;
function run(executable, args, options = {}) {
  const result = spawnSync(executable, args, { cwd: root, stdio: 'inherit', ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${executable} failed with exit code ${result.status}`);
}

try {
  run(process.execPath, ['node_modules/prisma/build/index.js', 'generate', '--generator', 'client']);
  run(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.json']);
  run('docker', ['run', '--detach', '--rm', '--name', container, '--publish', '127.0.0.1::5432', '--env', 'POSTGRES_USER=local_2fa', '--env', 'POSTGRES_PASSWORD=local_2fa_only', '--env', 'POSTGRES_DB=local_2fa', '--tmpfs', '/var/lib/postgresql/data', 'postgres:16-alpine']);
  started = true;
  let ready = false;
  for (let i = 0; i < 45; i++) {
    const result = spawnSync('docker', ['exec', container, 'pg_isready', '-U', 'local_2fa', '-d', 'local_2fa'], { cwd: root, stdio: 'ignore' });
    if (result.status === 0) { ready = true; break; }
    await sleep(1000);
  }
  if (!ready) throw new Error('Temporary PostgreSQL did not become ready');
  const portResult = spawnSync('docker', ['port', container, '5432/tcp'], { cwd: root, encoding: 'utf8' });
  if (portResult.error || portResult.status !== 0) throw new Error('Could not get temporary PostgreSQL port');
  const match = portResult.stdout.trim().match(/^127\.0\.0\.1:(\d+)$/);
  if (!match) throw new Error('Unexpected PostgreSQL port mapping');
  const env = { ...process.env, NODE_ENV: 'development', DATABASE_URL: `postgresql://local_2fa:local_2fa_only@127.0.0.1:${match[1]}/local_2fa`, TOTP_ENCRYPTION_KEY_BASE64: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=', COOKIE_SECURE: 'false', SESSION_COOKIE_NAME: 'local_2fa_sid' };
  run(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], { env });
  run(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', '--config', 'vitest.config.postgres.ts', 'test/integration/twoFactor.postgres.test.ts'], { env });
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (started) {
    const cleanup = spawnSync('docker', ['stop', container], { cwd: root, stdio: 'inherit' });
    if (cleanup.error || cleanup.status !== 0) {
      console.error(`Could not remove temporary container ${container}`);
      process.exitCode = 1;
    }
  }
}
