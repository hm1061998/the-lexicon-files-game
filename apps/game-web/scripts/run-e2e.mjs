import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const appDir = fileURLToPath(new URL('..', import.meta.url));
const repoRoot = fileURLToPath(new URL('../../..', import.meta.url));
const viteCli = path.join(repoRoot, 'node_modules', 'vite', 'bin', 'vite.js');
const playwrightCli = path.join(repoRoot, 'node_modules', 'playwright', 'cli.js');
const baseUrl = 'http://127.0.0.1:5174';

function waitForExit(child) {
  return new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => resolve(code ?? (signal ? 1 : 0)));
  });
}

async function waitForServer(server) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null || server.signalCode !== null) {
      throw new Error(`Vite exited before serving (${server.exitCode ?? server.signalCode})`);
    }
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // Vite is still starting.
    }
    await delay(100);
  }
  throw new Error(`Vite did not become ready at ${baseUrl} within 30 seconds`);
}

async function stopServer(server) {
  if (server.exitCode !== null || server.signalCode !== null) return;
  server.kill('SIGTERM');
  const exited = await Promise.race([
    waitForExit(server).then(() => true),
    delay(5_000).then(() => false),
  ]);
  if (!exited) {
    server.kill('SIGKILL');
    await Promise.race([waitForExit(server), delay(2_000)]);
  }
}

const server = spawn(
  process.execPath,
  [viteCli, '--force', '--host', '127.0.0.1', '--port', '5174', '--strictPort'],
  { cwd: appDir, stdio: 'inherit', windowsHide: true },
);

let exitCode = 1;
try {
  await waitForServer(server);
  const runner = spawn(process.execPath, [playwrightCli, 'test', ...process.argv.slice(2)], {
    cwd: appDir,
    stdio: 'inherit',
    windowsHide: true,
  });
  exitCode = await waitForExit(runner);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
} finally {
  await stopServer(server);
}

process.exitCode = exitCode;
