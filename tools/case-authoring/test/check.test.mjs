import assert from 'node:assert/strict';
import test from 'node:test';

import { checkTree, collectFlags, scanJsonFlags } from '../src/checkDialogue.mjs';
import { compileTree } from '../src/compileDialogue.mjs';
import { parseDialogueYaml } from '../src/parseDialogueYaml.mjs';

const vocabulary = [
  { id: 'address', lemma: 'address', surfaceForms: ['addresses'] },
  { id: 'sign', lemma: 'sign', surfaceForms: ['signed'] },
  { id: 'sign_off', lemma: 'sign off', surfaceForms: ['signed'] },
];
const refs = {
  evidence: new Set(['chat_messages', 'delivery_note']),
  fact: new Set(['fact_a']),
  objective: new Set(['find_out']),
};
const ctx = { file: 'dialogues/t.yaml', vocabulary, refs };

const BASE = `tree: t
npc: anna
done: t_done
finish: [seen_a]
notes:
  topic_a: seen_a
nodes:
  entry:
    say: "Hello. What do you want?"
    ask:
      - { id: ask_a, say: "Topic A?", to: topic_a }
  topic_a:
    say: "About the [address]."
    do: [set seen_a]
    ask:
      - { id: back, say: "Back", to: entry }
`;

/** 1-based line and column of the first `needle` in the source. */
function pos(source, needle) {
  const index = source.indexOf(needle);
  assert.notEqual(index, -1, `${needle} not in source`);
  const before = source.slice(0, index);
  const line = before.split('\n').length;
  return { line, col: index - before.lastIndexOf('\n') };
}

const issuesOf = (source, extra = {}) => compileTree(source, { ...ctx, ...extra }).issues;
const only = (issues, code) => issues.filter((i) => i.code === code);

test('a clean file has no issues at all', () => {
  const { tree, issues } = compileTree(BASE, ctx);
  assert.deepEqual(issues, []);
  assert.ok(tree);
});

test('unknown-key: a misspelt key at the tree, node and choice level, with a hint', () => {
  const source = BASE.replace('npc: anna', 'npcc: anna\nnpc: anna')
    .replace(
      '    say: "Hello. What do you want?"',
      '    say: "Hello. What do you want?"\n    sya: x',
    )
    .replace(
      '{ id: ask_a, say: "Topic A?", to: topic_a }',
      '{ id: ask_a, say: "Topic A?", to: topic_a, nede: [flag z] }',
    );
  const found = only(issuesOf(source), 'unknown-key');
  assert.deepEqual(
    found.map((i) => [i.line, i.col]),
    [pos(source, 'npcc'), pos(source, 'sya'), pos(source, 'nede')].map((p) => [p.line, p.col]),
  );
  assert.ok(found.every((i) => i.level === 'error'));
  assert.match(found[0].hint, /npc/);
  assert.match(found[1].hint, /say/);
  assert.match(found[2].hint, /needs/);
});

test('unknown-node: a choice target and the entry, pointing at the value, with the nearest node', () => {
  const source = BASE.replace('to: topic_a }', 'to: topic_aa }').replace(
    'nodes:',
    'entry: entri\nnodes:',
  );
  const found = only(issuesOf(source), 'unknown-node');
  assert.equal(found.length, 2);
  const target = pos(source, 'topic_aa');
  assert.ok(found.some((i) => i.line === target.line && i.col === target.col));
  const entry = pos(source, 'entri');
  assert.ok(found.some((i) => i.line === entry.line && i.col === entry.col));
  assert.ok(found.some((i) => /topic_a/.test(i.hint ?? '')));
  assert.ok(found.some((i) => /entry/.test(i.hint ?? '')));
});

test('duplicate-id: a node key twice and a choice id twice in one node', () => {
  const dupNode = BASE + '  entry:\n    say: "again"\n';
  const nodeIssues = only(issuesOf(dupNode), 'duplicate-id');
  assert.equal(nodeIssues.length, 1);
  const dupChoice = BASE.replace(
    '      - { id: ask_a, say: "Topic A?", to: topic_a }',
    '      - { id: ask_a, say: "Topic A?", to: topic_a }\n      - { id: ask_a, say: "Again?", to: topic_a }',
  );
  const choiceIssues = only(issuesOf(dupChoice), 'duplicate-id');
  assert.equal(choiceIssues.length, 1);
  assert.equal(choiceIssues[0].level, 'error');
  assert.equal(choiceIssues[0].line, pos(dupChoice, '{ id: ask_a, say: "Again?"').line);
});

test('unknown-ref: evidence, fact and objective ids that the case does not have, with a hint', () => {
  const source = BASE.replace(
    'do: [set seen_a]',
    'do: [set seen_a, give chat_mesages, unlock fact_b, complete find_it]',
  ).replace(
    '{ id: back, say: "Back", to: entry }',
    '{ id: back, say: "Back", to: entry, needs: [evidence delivery_nte] }',
  );
  const found = only(issuesOf(source), 'unknown-ref');
  assert.equal(found.length, 4);
  assert.ok(found.every((i) => i.level === 'error'));
  const hints = found.map((i) => i.hint ?? '').join(' ');
  assert.match(hints, /chat_messages/);
  assert.match(hints, /delivery_note/);
  const first = pos(source, 'give chat_mesages');
  assert.ok(found.some((i) => i.line === first.line && i.col === first.col));
});

test('unknown-ref is skipped when the case has no reference files', () => {
  const source = BASE.replace('do: [set seen_a]', 'do: [set seen_a, give anything]');
  assert.deepEqual(only(issuesOf(source, { refs: null }), 'unknown-ref'), []);
});

test('unknown-word and ambiguous-word point at the line of the say value', () => {
  const unknown = BASE.replace('About the [address].', 'About the [harper].');
  const found = only(issuesOf(unknown), 'unknown-word');
  assert.equal(found.length, 1);
  assert.equal(found[0].line, pos(unknown, 'About the [harper]').line);
  const ambiguous = BASE.replace('About the [address].', 'He [signed] it.');
  assert.equal(only(issuesOf(ambiguous), 'ambiguous-word').length, 1);
});

test('orphan-node is a warning on the node key', () => {
  const source = BASE + '  lost:\n    say: "Nobody comes here."\n';
  const { tree, issues } = compileTree(source, ctx);
  const orphan = only(issues, 'orphan-node');
  assert.equal(orphan.length, 1);
  assert.equal(orphan[0].level, 'warn');
  assert.equal(orphan[0].line, pos(source, 'lost:').line);
  assert.ok(tree, 'a warning must not stop the build');
});

test('flag-never-set and flag-never-read are warnings', () => {
  const source = BASE.replace('do: [set seen_a]', 'do: [set seen_a, set spare]').replace(
    'finish: [seen_a]',
    'finish: [seen_a, ghost]',
  );
  const { tree, issues } = compileTree(source, ctx);
  const never = issues.filter((i) => i.code === 'flag-never-set' || i.code === 'flag-never-read');
  assert.deepEqual(never.map((i) => [i.code, i.level]).sort(), [
    ['flag-never-read', 'warn'],
    ['flag-never-set', 'warn'],
  ]);
  assert.match(never.find((i) => i.code === 'flag-never-set').message, /ghost/);
  assert.match(never.find((i) => i.code === 'flag-never-read').message, /spare/);
  assert.ok(tree);
});

test('flags set or read elsewhere in the case do not warn', () => {
  const source = BASE.replace('do: [set seen_a]', 'do: [set seen_a, set spare]').replace(
    'finish: [seen_a]',
    'finish: [seen_a, ghost]',
  );
  const { issues } = compileTree(source, {
    ...ctx,
    externalReads: new Set(['spare']),
    externalSets: new Set(['ghost']),
  });
  assert.deepEqual(issues, []);
});

test('collectFlags and scanJsonFlags find flags in a tree and in case JSON', () => {
  const parsed = parseDialogueYaml(BASE, 't.yaml');
  const { sets, reads } = collectFlags(parsed.doc);
  assert.deepEqual([...sets], ['seen_a']);
  assert.deepEqual([...reads].sort(), ['seen_a']);
  const json = {
    a: { type: 'flag', key: 'x', value: true },
    b: [
      { type: 'setFlag', key: 'y', value: true },
      { type: 'all', conditions: [{ type: 'flag', key: 'z', value: false }] },
    ],
  };
  const scanned = scanJsonFlags(json);
  assert.deepEqual([...scanned.reads].sort(), ['x', 'z']);
  assert.deepEqual([...scanned.sets], ['y']);
});

test('checkTree on a file that did not parse reports nothing of its own', () => {
  const parsed = parseDialogueYaml('tree: [oops', 'bad.yaml');
  assert.deepEqual(checkTree(parsed, ctx), []);
});
