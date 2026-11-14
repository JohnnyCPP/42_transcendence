import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const project = `taskflow-rbac-${randomBytes(5).toString('hex')}`;
const base = ['compose', '-p', project, '-f', 'tests/compose.rbac.yml'];
let result;
try {
  result = spawnSync('docker', [...base, 'up', '--build', '--abort-on-container-exit', '--exit-code-from', 'rbac-tests'], { stdio: 'inherit' });
  if (result.error) throw result.error;
} finally {
  const cleanup = spawnSync('docker', [...base, 'down', '--remove-orphans'], { stdio: 'inherit' });
  if (cleanup.error || cleanup.status !== 0) {
    console.error(`Could not remove isolated test containers for ${project}.`);
    process.exitCode = 1;
  }
}
if (result?.status !== 0) process.exitCode = result?.status || 1;
