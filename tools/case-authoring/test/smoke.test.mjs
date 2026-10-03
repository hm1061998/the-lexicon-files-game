import assert from 'node:assert/strict';
import test from 'node:test';

import { run } from '../src/cli.mjs';

const capture = () => {
  const lines = { out: [], err: [] };
  return {
    lines,
    env: { out: (s) => lines.out.push(s), err: (s) => lines.err.push(s) },
  };
};

test('a command without a case id fails and prints the usage', async () => {
  const { lines, env } = capture();
  assert.equal(await run(['build'], env), 1);
  assert.match(lines.err.join('\n'), /Cách dùng|Usage/);
});

test('--help succeeds', async () => {
  const { lines, env } = capture();
  assert.equal(await run(['--help'], env), 0);
  assert.match(lines.out.join('\n'), /case:build/);
});

test('an unknown command fails', async () => {
  const { env } = capture();
  assert.equal(await run(['explode', 'case-001'], env), 1);
});
