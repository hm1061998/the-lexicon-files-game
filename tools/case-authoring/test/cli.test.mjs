import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { run } from '../src/cli.mjs';

const FIXTURE = resolve(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'root');
const CASE = 'mini-case';

function workspace() {
  const root = mkdtempSync(join(tmpdir(), 'case-authoring-'));
  cpSync(FIXTURE, root, { recursive: true });
  const dir = join(root, 'packages', 'game-content', 'cases', CASE);
  return {
    root,
    dir,
    json: join(dir, 'dialogues.json'),
    yaml: (id) => join(dir, 'dialogues', `${id}.yaml`),
  };
}

async function cli(root, ...argv) {
  const out = [];
  const err = [];
  const code = await run(argv, { cwd: root, out: (s) => out.push(s), err: (s) => err.push(s) });
  return {
    code,
    out: out.join('\n'),
    err: err.join('\n'),
    text: `${out.join('\n')}\n${err.join('\n')}`,
  };
}

test('build writes dialogues.json in npc order and tells what to run next', async () => {
  const ws = workspace();
  const result = await cli(ws.root, 'build', CASE);
  assert.equal(result.code, 0, result.text);
  const written = JSON.parse(readFileSync(ws.json, 'utf8'));
  assert.deepEqual(
    written.dialogues.map((t) => t.id),
    ['anna_mini', 'leo_mini'],
  );
  assert.equal(written.dialogues[0].nodes[0].vocabularySpans[0].vocabularyId, 'address');
  assert.match(result.out, /anna_mini\.yaml/);
  assert.match(result.out, /npm run test -w @lexicon\/game-content/);
  assert.ok(!readFileSync(ws.json, 'utf8').includes('\r'));
  assert.ok(readFileSync(ws.json, 'utf8').endsWith('}\n'));
});

test('a build with an error exits 1, shows line:col and code, and leaves dialogues.json alone', async () => {
  const ws = workspace();
  assert.equal((await cli(ws.root, 'build', CASE)).code, 0);
  const before = readFileSync(ws.json, 'utf8');
  const broken = readFileSync(ws.yaml('anna_mini'), 'utf8').replace('to: topic }', 'to: topik }');
  writeFileSync(ws.yaml('anna_mini'), broken);
  const result = await cli(ws.root, 'build', CASE);
  assert.equal(result.code, 1);
  assert.match(result.text, /anna_mini\.yaml:\d+:\d+\s+unknown-node/);
  assert.match(result.text, /ý bạn là: topic/);
  assert.equal(readFileSync(ws.json, 'utf8'), before);
});

test('a missing tree file is an error naming the file', async () => {
  const ws = workspace();
  rmSync(ws.yaml('leo_mini'));
  const result = await cli(ws.root, 'build', CASE);
  assert.equal(result.code, 1);
  assert.match(result.text, /leo_mini\.yaml.*missing-tree/);
});

test('build creates no dialogues.json when the very first build fails', async () => {
  const ws = workspace();
  rmSync(ws.yaml('leo_mini'));
  await cli(ws.root, 'build', CASE);
  assert.equal(existsSync(ws.json), false);
  assert.equal(existsSync(`${ws.json}.tmp`), false);
});

test('--check passes when JSON matches the YAML, fails after a hand edit and names the place', async () => {
  const ws = workspace();
  await cli(ws.root, 'build', CASE);
  assert.equal((await cli(ws.root, 'build', CASE, '--check')).code, 0);
  const edited = readFileSync(ws.json, 'utf8').replace('"Hi."', '"Hi!"');
  writeFileSync(ws.json, edited);
  const result = await cli(ws.root, 'build', CASE, '--check');
  assert.equal(result.code, 1);
  assert.match(result.text, /leo_mini/);
  assert.match(result.text, /entry/);
  assert.match(result.text, /text/);
});

test('--check also fails when only the formatting differs', async () => {
  const ws = workspace();
  await cli(ws.root, 'build', CASE);
  const compact = JSON.stringify(JSON.parse(readFileSync(ws.json, 'utf8')));
  writeFileSync(ws.json, compact);
  const result = await cli(ws.root, 'build', CASE, '--check');
  assert.equal(result.code, 1);
  assert.match(result.text, /định dạng|thứ tự/);
});

test('--check does not write anything', async () => {
  const ws = workspace();
  const result = await cli(ws.root, 'build', CASE, '--check');
  assert.equal(result.code, 1);
  assert.equal(existsSync(ws.json), false);
});

test('CRLF files compile like LF files and --check does not report a false drift', async () => {
  const ws = workspace();
  for (const id of ['anna_mini', 'leo_mini'])
    writeFileSync(ws.yaml(id), readFileSync(ws.yaml(id), 'utf8').replaceAll('\n', '\r\n'));
  assert.equal((await cli(ws.root, 'build', CASE)).code, 0);
  writeFileSync(ws.json, readFileSync(ws.json, 'utf8').replaceAll('\n', '\r\n'));
  assert.equal((await cli(ws.root, 'build', CASE, '--check')).code, 0);
});

test('warnings are printed but do not change the exit code', async () => {
  const ws = workspace();
  const source = readFileSync(ws.yaml('leo_mini'), 'utf8').replace(
    'do: [set leo_topic_done]',
    'do: [set leo_topic_done, set spare_flag]',
  );
  writeFileSync(ws.yaml('leo_mini'), source);
  const result = await cli(ws.root, 'build', CASE);
  assert.equal(result.code, 0, result.text);
  assert.match(result.text, /warn.*flag-never-read.*spare_flag/);
});

test('import turns dialogues.json into YAML, verifies the result and will not overwrite without --force', async () => {
  const ws = workspace();
  await cli(ws.root, 'build', CASE);
  rmSync(ws.yaml('anna_mini'));
  rmSync(ws.yaml('leo_mini'));
  const imported = await cli(ws.root, 'import', CASE);
  assert.equal(imported.code, 0, imported.text);
  assert.ok(existsSync(ws.yaml('anna_mini')) && existsSync(ws.yaml('leo_mini')));
  assert.match(imported.out, /verify/);
  const again = await cli(ws.root, 'import', CASE);
  assert.equal(again.code, 1);
  assert.match(again.text, /--force/);
  assert.equal((await cli(ws.root, 'import', CASE, '--force')).code, 0);
});

test('an unknown case id is a clear error', async () => {
  const ws = workspace();
  const result = await cli(ws.root, 'build', 'no-such-case');
  assert.equal(result.code, 1);
  assert.match(result.text, /no-such-case/);
});
