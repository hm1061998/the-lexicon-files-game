import assert from 'node:assert/strict';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { repositoryFileExists, runValidation } from '../src/cli.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const VALID_MEMORY = `---
schema_version: 1
updated_at: 2026-09-28T10:30:00+07:00
phase: phase-0a
status: in_progress
result_commit: d26e3b4
active_spec: none
active_plan: none
---

## Metadata
- Schema 1
## Current Phase
- Phase 0A
## Active Goal
- Add durable memory
## Current Status
- In progress
## Completed
- Validator
## In Progress
- CLI
## Active Decisions
- Compact memory
## Blockers
- None
## Next Actions
- Finish verification
## Verification
- Pending
## Latest Handoff
- Continue Task 2
## Required Reading
- Active plan
`;

function run(source = VALID_MEMORY, overrides = {}) {
  const stdout = [];
  const stderr = [];
  const exitCode = runValidation({
    repoRoot: 'C:/repo',
    memoryPath: 'docs/ai/MEMORY.md',
    readFile: () => source,
    pathExists: () => true,
    commitExists: () => true,
    writeOut: (line) => stdout.push(line),
    writeErr: (line) => stderr.push(line),
    ...overrides,
  });

  return { exitCode, stdout, stderr };
}

test('valid memory returns zero and one concise PASS line', () => {
  const result = run();

  assert.equal(result.exitCode, 0);
  assert.deepEqual(result.stderr, []);
  assert.deepEqual(result.stdout, [
    'memory:check PASS phase=phase-0a active_plan=none next_action=Finish verification',
  ]);
});

test('invalid memory returns one and emits actionable errors only', () => {
  const source = VALID_MEMORY.replace('status: in_progress\n', '');
  const result = run(source);

  assert.equal(result.exitCode, 1);
  assert.deepEqual(result.stdout, []);
  assert.equal(result.stderr.length, 1);
  assert.match(result.stderr[0], /status/);
});

test('read failure returns one and names the memory path', () => {
  const result = run(VALID_MEMORY, {
    readFile: () => {
      throw new Error('access denied');
    },
  });

  assert.equal(result.exitCode, 1);
  assert.deepEqual(result.stdout, []);
  assert.match(result.stderr[0], /docs\/ai\/MEMORY\.md.*access denied/);
});

test('Git adapter failure returns one with result_commit context', () => {
  const result = run(VALID_MEMORY, {
    commitExists: () => {
      throw new Error('git unavailable');
    },
  });

  assert.equal(result.exitCode, 1);
  assert.deepEqual(result.stdout, []);
  assert.match(result.stderr[0], /result_commit.*git unavailable/);
});

test('repository file adapter accepts files only within the repository', () => {
  assert.equal(repositoryFileExists(REPO_ROOT, 'package.json'), true);
  assert.equal(repositoryFileExists(REPO_ROOT, 'docs'), false);
  assert.equal(repositoryFileExists(REPO_ROOT, resolve(REPO_ROOT, 'package.json')), false);
  assert.equal(repositoryFileExists(REPO_ROOT, '../package.json'), false);
});
