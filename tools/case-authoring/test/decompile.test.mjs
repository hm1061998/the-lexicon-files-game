import assert from 'node:assert/strict';
import test from 'node:test';
import { parse } from 'yaml';

import { compileTree } from '../src/compileDialogue.mjs';
import { decompileTree } from '../src/decompileDialogue.mjs';

const vocabulary = [
  { id: 'address', lemma: 'address', surfaceForms: ['addresses'] },
  { id: 'sign', lemma: 'sign', surfaceForms: ['signed'] },
];
const ctx = { file: 'x.yaml', vocabulary };

const tree = {
  id: 'anna_delivery',
  npcId: 'anna',
  entryNodeId: 'entry',
  nodes: [
    {
      id: 'entry',
      speakerId: 'anna',
      text: 'What address did you check?',
      audio: { url: '/audio/a.wav', textSha256: 'abc' },
      translationVi: 'Địa chỉ nào?',
      vocabularySpans: [{ start: 5, end: 12, vocabularyId: 'address' }],
      terminal: false,
      choices: [
        {
          id: 'go',
          text: 'Go on',
          translationVi: 'Tiếp',
          nextNodeId: 'end',
          condition: {
            type: 'all',
            conditions: [
              { type: 'flag', key: 'a', value: true },
              { type: 'hasEvidence', evidenceId: 'e' },
            ],
          },
          effects: [
            { type: 'addEvidence', evidenceId: 'e' },
            { type: 'setFlag', key: 'seen', value: true },
          ],
        },
      ],
    },
    {
      id: 'end',
      speakerId: 'leo',
      text: 'Bye [now]',
      terminal: true,
      choices: [],
      condition: { type: 'all', conditions: [{ type: 'flag', key: 'a', value: true }] },
    },
  ],
  completionFlag: 'anna_done',
  completionCondition: {
    type: 'all',
    conditions: [
      { type: 'flag', key: 'x', value: true },
      { type: 'flag', key: 'y', value: true },
    ],
  },
  notebookStatements: [
    { nodeId: 'entry', recordedCondition: { type: 'flag', key: 'r', value: true } },
    {
      nodeId: 'end',
      recordedCondition: { type: 'any', conditions: [{ type: 'hasFact', factId: 'f' }] },
    },
  ],
};

test('a tree becomes short YAML with the documented keys', () => {
  const { yaml, issues } = decompileTree(tree, vocabulary);
  assert.deepEqual(issues, []);
  const doc = parse(yaml);
  assert.deepEqual(Object.keys(doc), ['tree', 'npc', 'done', 'finish', 'notes', 'nodes']);
  assert.equal(doc.tree, 'anna_delivery');
  assert.equal(doc.npc, 'anna');
  assert.deepEqual(doc.finish, ['x', 'y']);
  assert.equal(doc.notes.entry, 'r');
  assert.deepEqual(doc.notes.end, { any: ['fact f'] });
  assert.equal(doc.nodes.entry.say, 'What [address] did you check?');
  assert.deepEqual(doc.nodes.entry.ask[0].needs, ['flag a', 'evidence e']);
  assert.deepEqual(doc.nodes.entry.ask[0].do, ['give e', 'set seen']);
  assert.equal(doc.nodes.end.speaker, 'leo');
  assert.deepEqual(doc.nodes.end.needs, { all: ['flag a'] });
  assert.equal(doc.nodes.end.say, 'Bye \\[now]');
  assert.equal(doc.nodes.end.ask, undefined);
  assert.equal(doc.nodes.entry.speaker, undefined);
});

test('decompiling then compiling gives the tree back', () => {
  const { yaml } = decompileTree(tree, vocabulary);
  const back = compileTree(yaml, ctx);
  assert.deepEqual(back.issues, []);
  assert.deepEqual(back.tree, tree);
});

test('the entry is written only when it is not the first node', () => {
  const moved = { ...tree, entryNodeId: 'end', nodes: [...tree.nodes] };
  const { yaml } = decompileTree(moved, vocabulary);
  assert.equal(parse(yaml).entry, 'end');
  assert.equal(parse(decompileTree(tree, vocabulary).yaml).entry, undefined);
});

test('overlapping spans cannot be written, and nothing is produced', () => {
  const bad = JSON.parse(JSON.stringify(tree));
  bad.nodes[0].vocabularySpans = [
    { start: 5, end: 12, vocabularyId: 'address' },
    { start: 8, end: 14, vocabularyId: 'sign' },
  ];
  const { yaml, issues } = decompileTree(bad, vocabulary);
  assert.equal(yaml, null);
  assert.equal(issues[0].level, 'error');
  assert.equal(issues[0].code, 'not-representable');
  assert.match(issues[0].message, /anna_delivery/);
  assert.match(issues[0].message, /entry/);
});

test('an authored empty vocabularySpans list survives as spans: []', () => {
  const withEmpty = JSON.parse(JSON.stringify(tree));
  withEmpty.nodes[1].vocabularySpans = [];
  const { yaml, issues } = decompileTree(withEmpty, vocabulary);
  assert.deepEqual(issues, []);
  assert.deepEqual(parse(yaml).nodes.end.spans, []);
  assert.deepEqual(compileTree(yaml, ctx).tree, withEmpty);
  // No key and no marks stays no key.
  assert.equal(
    compileTree(decompileTree(tree, vocabulary).yaml, ctx).tree.nodes[1].vocabularySpans,
    undefined,
  );
});
