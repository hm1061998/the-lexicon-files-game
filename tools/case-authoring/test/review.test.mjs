import assert from 'node:assert/strict';
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { compileTree } from '../src/compileDialogue.mjs';
import { parseNeeds } from '../src/forms.mjs';
import { run } from '../src/cli.mjs';
import { extractSpans } from '../src/vocab.mjs';

const FIXTURE = resolve(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'root');
const CASE = 'mini-case';
const vocabulary = [
  { id: 'cash', lemma: 'cash', surfaceForms: [] },
  { id: 'cafe', lemma: 'café', surfaceForms: [] },
];
const ctx = { file: 't.yaml', vocabulary };
const wrap = (nodes) => `tree: t\nnpc: a\ndone: d\nfinish: [x]\nnodes:\n${nodes}`;
const errors = (issues) => issues.filter((i) => i.level === 'error');

function workspace() {
  const root = mkdtempSync(join(tmpdir(), 'case-review-'));
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
  const lines = [];
  const code = await run(argv, { cwd: root, out: (s) => lines.push(s), err: (s) => lines.push(s) });
  return { code, text: lines.join('\n') };
}

test('an ask that is not a list is an error, not a silent terminal node', () => {
  for (const ask of ['ask:\n      id: x\n      say: y\n      to: end', 'ask: oops', 'ask:']) {
    const { tree, issues } = compileTree(
      wrap(`  entry:\n    say: hi\n    ${ask}\n  end:\n    say: bye\n`),
      ctx,
    );
    assert.equal(tree, null, ask);
    assert.ok(
      errors(issues).some((i) => i.code === 'bad-form' && /ask/.test(i.message)),
      ask,
    );
  }
});

test('a null or scalar ask item is a positioned error, never a crash', () => {
  for (const item of ['-', '- go']) {
    const { tree, issues } = compileTree(
      wrap(`  entry:\n    say: hi\n    ask:\n      ${item}\n`),
      ctx,
    );
    assert.equal(tree, null);
    assert.ok(errors(issues).length >= 1);
    assert.ok(errors(issues).every((i) => i.line >= 1 && i.col >= 1));
  }
});

test('ids, texts and targets must be strings', () => {
  const bad = wrap('  entry:\n    say: 1990\n    ask:\n      - { id: 1, say: hi, to: 7 }\n');
  const { tree, issues } = compileTree(bad, ctx);
  assert.equal(tree, null);
  const forms = errors(issues).filter((i) => i.code === 'bad-form');
  assert.ok(forms.length >= 3, JSON.stringify(forms));
});

test('integer-like node ids are refused, so node order can never change silently', () => {
  const { tree, issues } = compileTree(wrap('  "10":\n    say: a\n  "2":\n    say: b\n'), ctx);
  assert.equal(tree, null);
  assert.ok(errors(issues).some((i) => /số nguyên|integer/i.test(i.message)));
});

test('an error inside a nested needs group points at the bad item', () => {
  const source = wrap(
    '  entry:\n    say: hi\n    ask:\n      - id: a\n        say: x\n        to: entry\n        needs:\n          - flag x\n          - flag y\n          - any:\n              - bogus z\n',
  );
  const { issues } = compileTree(source, ctx);
  const bad = errors(issues).find((i) => i.code === 'bad-form');
  assert.ok(bad);
  assert.equal(bad.line, source.split('\n').findIndex((l) => l.includes('bogus z')) + 1);
});

test('parseNeeds reports the path of a nested failure', () => {
  assert.throws(
    () => parseNeeds(['flag x', 'flag y', { any: ['bogus z'] }]),
    (e) => JSON.stringify(e.path) === JSON.stringify([2, 'any', 0]),
  );
});

test('markup in a choice line is an error, and an escaped bracket is a literal bracket', () => {
  const source = wrap(
    '  entry:\n    say: hi\n    ask:\n      - { id: a, say: "What [cash]?", to: entry }\n',
  );
  assert.ok(errors(compileTree(source, ctx).issues).some((i) => i.code === 'bad-form'));
  const ok = compileTree(
    wrap("  entry:\n    say: hi\n    ask:\n      - { id: a, say: 'Press \\[A]', to: entry }\n"),
    ctx,
  );
  assert.equal(ok.tree.nodes[0].choices[0].text, 'Press [A]');
});

test('a malformed notes value and a non-empty spans list are errors', () => {
  const notes = wrap('  entry:\n    say: hi\n').replace('nodes:', 'notes: [entry]\nnodes:');
  assert.ok(errors(compileTree(notes, ctx).issues).some((i) => i.code === 'bad-form'));
  const spans = wrap(
    '  entry:\n    say: hi\n    spans: [{ start: 0, end: 2, vocabularyId: cash }]\n',
  );
  assert.ok(errors(compileTree(spans, ctx).issues).some((i) => i.code === 'bad-form'));
});

test('a vocabulary error points at the bracket on its line', () => {
  const source = wrap('  entry:\n    say: "I like [nope] and more"\n');
  const issue = errors(compileTree(source, ctx).issues).find((i) => i.code === 'unknown-word');
  const line = source.split('\n')[issue.line - 1];
  assert.equal(line.slice(issue.col - 1, issue.col - 1 + 6), '[nope]');
});

test('words match without regard to Unicode normalisation', () => {
  const decomposed = 'café';
  const r = extractSpans(`A [${decomposed}] here`, vocabulary);
  assert.deepEqual(r.issues, []);
  assert.equal(r.spans[0].vocabularyId, 'cafe');
});

test('a tree whose id or npc does not match the npcs.json entry is an error', async () => {
  const ws = workspace();
  writeFileSync(
    ws.yaml('leo_mini'),
    readFileSync(ws.yaml('leo_mini'), 'utf8').replace('tree: leo_mini', 'tree: WRONG'),
  );
  const result = await cli(ws.root, 'build', CASE);
  assert.equal(result.code, 1);
  assert.match(result.text, /tree-mismatch/);
  assert.equal(existsSync(ws.json), false);
});

test('a YAML file that no npc uses is an error, even if it does not parse', async () => {
  const ws = workspace();
  writeFileSync(ws.yaml('stray'), 'garbage: [');
  const result = await cli(ws.root, 'build', CASE);
  assert.equal(result.code, 1);
  assert.match(result.text, /stray\.yaml.*unused-tree/);
});

test('an unknown flag and a flag before the case id are refused, so a typo never rewrites the file', async () => {
  const ws = workspace();
  const typo = await cli(ws.root, 'build', CASE, '--chek');
  assert.equal(typo.code, 1);
  assert.equal(existsSync(ws.json), false);
  assert.equal((await cli(ws.root, 'build', CASE)).code, 0);
  assert.equal((await cli(ws.root, 'build', '--check', CASE)).code, 0);
});

test('a case id that is not a plain name cannot leave the cases folder', async () => {
  const ws = workspace();
  for (const id of ['../evil', '/abs/path', 'a/b', '..']) {
    const result = await cli(ws.root, 'build', id);
    assert.equal(result.code, 1, id);
  }
  assert.equal(existsSync(join(ws.root, 'packages', 'game-content', 'evil')), false);
});

test('a UTF-8 BOM in dialogues.json does not make --check say it is invalid JSON', async () => {
  const ws = workspace();
  await cli(ws.root, 'build', CASE);
  writeFileSync(ws.json, String.fromCharCode(0xfeff) + readFileSync(ws.json, 'utf8'));
  const result = await cli(ws.root, 'build', CASE, '--check');
  assert.doesNotMatch(result.text, /không phải JSON/);
});

test('a duplicate YAML key is reported in the tool language, not as a node id problem', () => {
  const { issues } = compileTree(wrap('  entry:\n    say: a\n    say: b\n'), ctx);
  assert.ok(errors(issues).length >= 1);
  assert.ok(errors(issues).every((i) => !/Map keys must be unique/.test(i.message)));
  assert.ok(errors(issues).some((i) => i.code === 'duplicate-key'));
});

test('import writes prettier-formatted YAML', async () => {
  const ws = workspace();
  await cli(ws.root, 'build', CASE);
  rmSync(ws.yaml('anna_mini'));
  rmSync(ws.yaml('leo_mini'));
  assert.equal((await cli(ws.root, 'import', CASE)).code, 0);
  for (const id of ['anna_mini', 'leo_mini']) {
    assert.doesNotMatch(readFileSync(ws.yaml(id), 'utf8'), /\[ \w+ \]/);
  }
});

test('a failed import check puts the YAML folder back as it was', async () => {
  const ws = workspace();
  await cli(ws.root, 'build', CASE);
  const data = JSON.parse(readFileSync(ws.json, 'utf8'));
  // A third tree no npc uses: the YAML written for it can never be part of a build.
  data.dialogues.push({ ...data.dialogues[0], id: 'extra_mini' });
  writeFileSync(ws.json, JSON.stringify(data));
  for (const id of ['anna_mini', 'leo_mini']) rmSync(ws.yaml(id));
  const result = await cli(ws.root, 'import', CASE);
  assert.equal(result.code, 1, result.text);
  assert.match(result.text, /hoàn lại/);
  assert.deepEqual(
    readdirSync(join(ws.dir, 'dialogues')).filter((f) => f.endsWith('.yaml')),
    [],
  );
});
