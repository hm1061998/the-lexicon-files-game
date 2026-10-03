import assert from 'node:assert/strict';
import test from 'node:test';

import { compileTree } from '../src/compileDialogue.mjs';

const vocabulary = [
  { id: 'address', lemma: 'address', surfaceForms: ['addresses'] },
  { id: 'package', lemma: 'package', surfaceForms: ['packages'] },
];
const ctx = { file: 'dialogues/anna_delivery.yaml', vocabulary };

const SOURCE = `
tree: anna_delivery
npc: anna
done: anna_interviewed
finish: [anna_address_question_done]
notes:
  checked_address: anna_address_checked_read
nodes:
  entry:
    say: "I prepared the delivery. What would you like to check?"
    vi: "Tôi chuẩn bị chuyến giao hàng."
    audio: { url: /audio/x.wav, textSha256: abc }
    ask:
      - { id: check_address, say: "What address?", vi: "Địa chỉ nào?", to: checked_address }
      - { id: confirm, say: "Confirm?", to: checked_address, needs: [evidence chat_messages] }
  checked_address:
    say: "I checked the [address] of the [package]."
    do: [set anna_address_checked_read]
    ask:
      - id: continue
        say: Continue asking
        to: entry
        do: [set anna_address_question_done]
  goodbye:
    say: Goodbye.
    speaker: leo
`;

test('a tree compiles to the engine shape in the fixed key order', () => {
  const { tree, issues } = compileTree(SOURCE, ctx);
  assert.deepEqual(issues, []);
  assert.deepEqual(Object.keys(tree), [
    'id',
    'npcId',
    'entryNodeId',
    'nodes',
    'completionFlag',
    'completionCondition',
    'notebookStatements',
  ]);
  assert.equal(tree.id, 'anna_delivery');
  assert.equal(tree.npcId, 'anna');
  assert.equal(tree.entryNodeId, 'entry');
  assert.equal(tree.completionFlag, 'anna_interviewed');
  assert.deepEqual(tree.completionCondition, {
    type: 'flag',
    key: 'anna_address_question_done',
    value: true,
  });
  assert.deepEqual(tree.notebookStatements, [
    {
      nodeId: 'checked_address',
      recordedCondition: { type: 'flag', key: 'anna_address_checked_read', value: true },
    },
  ]);
});

test('node keys follow the schema order and optional keys are left out', () => {
  const { tree } = compileTree(SOURCE, ctx);
  const [entry, checked, goodbye] = tree.nodes;
  assert.deepEqual(Object.keys(entry), [
    'id',
    'speakerId',
    'text',
    'audio',
    'translationVi',
    'terminal',
    'choices',
  ]);
  assert.deepEqual(entry.audio, { url: '/audio/x.wav', textSha256: 'abc' });
  assert.equal(entry.speakerId, 'anna');
  assert.equal(entry.terminal, false);
  assert.deepEqual(Object.keys(entry.choices[0]), ['id', 'text', 'translationVi', 'nextNodeId']);
  assert.deepEqual(Object.keys(entry.choices[1]), ['id', 'text', 'nextNodeId', 'condition']);
  assert.deepEqual(entry.choices[1].condition, {
    type: 'hasEvidence',
    evidenceId: 'chat_messages',
  });
  assert.deepEqual(Object.keys(checked), [
    'id',
    'speakerId',
    'text',
    'vocabularySpans',
    'terminal',
    'choices',
    'effects',
  ]);
  assert.equal(checked.text, 'I checked the address of the package.');
  assert.deepEqual(checked.vocabularySpans, [
    { start: 14, end: 21, vocabularyId: 'address' },
    { start: 29, end: 36, vocabularyId: 'package' },
  ]);
  assert.deepEqual(checked.effects, [
    { type: 'setFlag', key: 'anna_address_checked_read', value: true },
  ]);
  assert.deepEqual(checked.choices[0].effects, [
    { type: 'setFlag', key: 'anna_address_question_done', value: true },
  ]);
  assert.equal(goodbye.terminal, true);
  assert.deepEqual(goodbye.choices, []);
  assert.equal(goodbye.speakerId, 'leo');
});

test('the entry node defaults to the first node', () => {
  const { tree } = compileTree(SOURCE, ctx);
  assert.equal(tree.entryNodeId, 'entry');
  const other = SOURCE.replace('nodes:', 'entry: checked_address\nnodes:');
  assert.equal(compileTree(other, ctx).tree.entryNodeId, 'checked_address');
});

test('finish and notes accept the general needs form', () => {
  const source = SOURCE.replace(
    'finish: [anna_address_question_done]',
    'finish: { all: ["flag a", "flag b"] }',
  ).replace(
    'checked_address: anna_address_checked_read',
    'checked_address: ["flag r", "evidence e"]',
  );
  const { tree } = compileTree(source, ctx);
  assert.deepEqual(tree.completionCondition, {
    type: 'all',
    conditions: [
      { type: 'flag', key: 'a', value: true },
      { type: 'flag', key: 'b', value: true },
    ],
  });
  assert.deepEqual(tree.notebookStatements[0].recordedCondition, {
    type: 'all',
    conditions: [
      { type: 'flag', key: 'r', value: true },
      { type: 'hasEvidence', evidenceId: 'e' },
    ],
  });
});

test('a finish list of several flags means all of them', () => {
  const { tree } = compileTree(SOURCE.replace('[anna_address_question_done]', '[a, b]'), ctx);
  assert.deepEqual(tree.completionCondition, {
    type: 'all',
    conditions: [
      { type: 'flag', key: 'a', value: true },
      { type: 'flag', key: 'b', value: true },
    ],
  });
});

test('broken YAML is a yaml-syntax error with a position and no tree', () => {
  const { tree, issues } = compileTree('tree: a\nnodes:\n  entry: [oops\n', ctx);
  assert.equal(tree, null);
  assert.equal(issues[0].code, 'yaml-syntax');
  assert.equal(issues[0].level, 'error');
  assert.ok(issues[0].line >= 1 && issues[0].col >= 1);
  assert.equal(issues[0].file, ctx.file);
});

test('a bad do item is a bad-form error pointing at that item', () => {
  const { tree, issues } = compileTree(
    SOURCE.replace('do: [set anna_address_checked_read]', 'do: [hop x]'),
    ctx,
  );
  assert.equal(tree, null);
  assert.equal(issues[0].code, 'bad-form');
});
