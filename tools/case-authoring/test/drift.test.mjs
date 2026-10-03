import assert from 'node:assert/strict';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { run } from '../src/cli.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

// A hand edit of dialogues.json (or a YAML change without `npm run case:build`) fails here.
for (const caseId of ['case-001', 'case-002']) {
  test(`${caseId}/dialogues.json is exactly what its YAML compiles to`, async () => {
    const lines = [];
    const code = await run(['build', caseId, '--check'], {
      cwd: ROOT,
      out: (s) => lines.push(s),
      err: (s) => lines.push(s),
    });
    assert.equal(code, 0, lines.join('\n'));
  });
}
