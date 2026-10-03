import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { formatJson, normalizeEol, writeAtomic } from '../src/io.mjs';

test('normalizeEol turns CRLF into LF', () => {
  assert.equal(normalizeEol('a\r\nb\r\n'), 'a\nb\n');
});

test('formatJson writes prettier style JSON that ends with a newline and uses LF', async () => {
  const text = await formatJson({ a: [1, 2], b: { c: 'x' } }, join(tmpdir(), 'x.json'));
  assert.equal(text, '{\n  "a": [1, 2],\n  "b": {\n    "c": "x"\n  }\n}\n');
  assert.ok(!text.includes('\r'));
});

test('writeAtomic replaces the file whole and leaves no temporary file', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ca-'));
  const target = join(dir, 'out.json');
  writeFileSync(target, 'old');
  await writeAtomic(target, 'new');
  assert.equal(readFileSync(target, 'utf8'), 'new');
  assert.equal(existsSync(`${target}.tmp`), false);
});
