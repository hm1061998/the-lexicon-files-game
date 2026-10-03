import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { compileTree } from '../src/compileDialogue.mjs';
import { decompileTree } from '../src/decompileDialogue.mjs';
import { loadCase } from '../src/io.mjs';
import { errorsOf } from './util.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

for (const caseId of ['case-001', 'case-002']) {
  const loaded = loadCase(ROOT, caseId);
  const { dialogues } = JSON.parse(readFileSync(resolve(loaded.dir, 'dialogues.json'), 'utf8'));

  for (const original of dialogues) {
    test(`${caseId} ${original.id}: JSON -> YAML -> JSON is the same tree`, () => {
      const { yaml, issues } = decompileTree(original, loaded.vocabulary);
      assert.deepEqual(issues, []);
      const back = compileTree(yaml, {
        file: `${original.id}.yaml`,
        vocabulary: loaded.vocabulary,
      });
      assert.deepEqual(errorsOf(back.issues), []);
      assert.deepEqual(back.tree, original);
      // And YAML -> JSON -> YAML is stable.
      const again = decompileTree(back.tree, loaded.vocabulary);
      assert.equal(again.yaml, yaml);
    });
  }
}

test('loadCase reads npcs in their order and the reference sets of the case', () => {
  const loaded = loadCase(ROOT, 'case-002');
  assert.deepEqual(
    loaded.npcs.map((n) => n.dialogueTreeId),
    ['anna_delivery', 'leo_delivery', 'david_delivery'],
  );
  assert.ok(loaded.vocabulary.some((w) => w.id === 'address'));
  assert.ok(loaded.refs.evidence.has('delivery_note'));
  assert.ok(loaded.refs.objective.has('find_what_happened'));
});
