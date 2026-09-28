import { Buffer } from 'node:buffer';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { validateMemory } from './memory-schema.mjs';

const DEFAULT_MEMORY_PATH = 'docs/ai/MEMORY.md';

export function runValidation(options) {
  const memoryPath = options.memoryPath ?? DEFAULT_MEMORY_PATH;
  let source;

  try {
    source = options.readFile(resolve(options.repoRoot, memoryPath));
  } catch (error) {
    options.writeErr(`memory:check ERROR ${memoryPath}: ${error.message}`);
    return 1;
  }

  const result = validateMemory(source, {
    byteLength: Buffer.byteLength(source, 'utf8'),
    pathExists: options.pathExists,
    commitExists: options.commitExists,
  });

  if (!result.valid) {
    for (const error of result.errors) options.writeErr(`memory:check ERROR ${error}`);
    return 1;
  }

  options.writeOut(
    `memory:check PASS phase=${result.phase} active_plan=${result.activePlan} next_action=${result.nextAction}`,
  );
  return 0;
}

function createDefaultOptions() {
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
  const safeDirectory = repoRoot.replaceAll('\\', '/');

  return {
    repoRoot,
    memoryPath: DEFAULT_MEMORY_PATH,
    readFile: (path) => readFileSync(path, 'utf8'),
    pathExists: (relativePath) => existsSync(resolve(repoRoot, relativePath)),
    commitExists: (commit) => {
      const result = spawnSync(
        'git',
        ['-c', `safe.directory=${safeDirectory}`, 'cat-file', '-e', `${commit}^{commit}`],
        { cwd: repoRoot, encoding: 'utf8' },
      );
      if (result.error) throw result.error;
      return result.status === 0;
    },
    writeOut: (line) => process.stdout.write(`${line}\n`),
    writeErr: (line) => process.stderr.write(`${line}\n`),
  };
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) {
  process.exitCode = runValidation(createDefaultOptions());
}
