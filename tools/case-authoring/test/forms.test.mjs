import assert from 'node:assert/strict';
import test from 'node:test';

import { FormError, formatDo, formatNeeds, parseDo, parseNeeds } from '../src/forms.mjs';

test('every do verb becomes its engine effect, in order', () => {
  assert.deepEqual(
    parseDo(['set a', 'clear b', 'give ev', 'unlock fa', 'activate ob', 'complete ob2']),
    [
      { type: 'setFlag', key: 'a', value: true },
      { type: 'setFlag', key: 'b', value: false },
      { type: 'addEvidence', evidenceId: 'ev' },
      { type: 'unlockFact', factId: 'fa' },
      { type: 'activateObjective', objectiveId: 'ob' },
      { type: 'completeObjective', objectiveId: 'ob2' },
    ],
  );
});

test('an unknown verb or a missing argument is a FormError with its index', () => {
  assert.throws(
    () => parseDo(['set a', 'hop x']),
    (e) => e instanceof FormError && e.index === 1 && /hop/.test(e.message),
  );
  assert.throws(
    () => parseDo(['set']),
    (e) => e instanceof FormError && e.index === 0,
  );
  assert.throws(() => parseDo('set a'), FormError);
});

test('formatDo is the exact inverse of parseDo', () => {
  const items = ['give ev', 'set a', 'clear b', 'unlock fa', 'activate o', 'complete p'];
  assert.deepEqual(formatDo(parseDo(items)), items);
});

test('a one item needs list is a single condition', () => {
  assert.deepEqual(parseNeeds(['flag a']), { type: 'flag', key: 'a', value: true });
  assert.deepEqual(parseNeeds(['no-flag a']), { type: 'flag', key: 'a', value: false });
  assert.deepEqual(parseNeeds(['evidence e']), { type: 'hasEvidence', evidenceId: 'e' });
  assert.deepEqual(parseNeeds(['fact f']), { type: 'hasFact', factId: 'f' });
  assert.deepEqual(parseNeeds(['objective o']), { type: 'objectiveCompleted', objectiveId: 'o' });
});

test('several items mean all of them', () => {
  assert.deepEqual(parseNeeds(['flag a', 'evidence e']), {
    type: 'all',
    conditions: [
      { type: 'flag', key: 'a', value: true },
      { type: 'hasEvidence', evidenceId: 'e' },
    ],
  });
});

test('explicit groups keep their shape, even an all with one item', () => {
  assert.deepEqual(parseNeeds({ all: ['flag a'] }), {
    type: 'all',
    conditions: [{ type: 'flag', key: 'a', value: true }],
  });
  assert.deepEqual(parseNeeds({ any: ['fact f', 'no-flag b'] }), {
    type: 'any',
    conditions: [
      { type: 'hasFact', factId: 'f' },
      { type: 'flag', key: 'b', value: false },
    ],
  });
});

test('groups nest inside a list', () => {
  const spec = ['flag a', { any: ['fact f', 'evidence e'] }];
  assert.deepEqual(parseNeeds(spec), {
    type: 'all',
    conditions: [
      { type: 'flag', key: 'a', value: true },
      {
        type: 'any',
        conditions: [
          { type: 'hasFact', factId: 'f' },
          { type: 'hasEvidence', evidenceId: 'e' },
        ],
      },
    ],
  });
});

test('formatNeeds is the exact inverse of parseNeeds for every shape', () => {
  const specs = [
    ['flag a'],
    ['no-flag a'],
    ['evidence e', 'fact f'],
    { all: ['flag a'] },
    { any: ['fact f', 'no-flag b'] },
    ['flag a', { any: ['fact f', 'evidence e'] }],
  ];
  for (const spec of specs) assert.deepEqual(formatNeeds(parseNeeds(spec)), spec);
});

test('a malformed needs item is a FormError', () => {
  assert.throws(() => parseNeeds(['mood happy']), FormError);
  assert.throws(() => parseNeeds([]), FormError);
  assert.throws(() => parseNeeds({ some: ['flag a'] }), FormError);
});

test('an all of several items formats as the plain list, and still means the same', () => {
  const spec = { all: ['objective o', { all: ['flag x'] }] };
  const formatted = formatNeeds(parseNeeds(spec));
  assert.deepEqual(formatted, ['objective o', { all: ['flag x'] }]);
  assert.deepEqual(parseNeeds(formatted), parseNeeds(spec));
});
