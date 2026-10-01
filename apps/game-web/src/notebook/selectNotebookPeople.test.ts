import { describe, expect, it } from 'vitest';
import { loadCaseDefinition } from '@lexicon/game-content';
import { createCaseState, evaluateCondition } from '@lexicon/game-core';
import type { CaseDefinition, GameState } from '@lexicon/shared-types';
import { selectNotebookPeople } from './selectNotebookPeople';

const definition = loadCaseDefinition('case-001');
function state(flags: GameState['flags'] = {}): GameState {
  return { ...createCaseState(definition), flags };
}
function freeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

describe('selectNotebookPeople', () => {
  it('hides fresh unrelated and metadata-free trees', () => {
    expect(selectNotebookPeople(definition, state())).toEqual([]);
    expect(selectNotebookPeople(definition, state({ unrelated: true }))).toEqual([]);
    const withoutMetadata: CaseDefinition = {
      ...definition,
      dialogues: definition.dialogues.map((tree) => ({ ...tree, notebookStatements: undefined })),
    };
    expect(selectNotebookPeople(withoutMetadata, state({ anna_q1_read: true }))).toEqual([]);
  });

  it('shows partial Anna in authored order', () => {
    const people = selectNotebookPeople(definition, state({ anna_q2_read: true }));
    expect(people).toHaveLength(1);
    expect(people[0]?.npc.id).toBe('anna');
    expect(people[0]?.treeId).toBe('anna_initial');
    expect(people[0]?.status).toBe('inProgress');
    expect(people[0]?.statements.map(({ id }) => id)).toEqual(['entry', 'answer2']);
  });

  it('completion never unlocks statements', () => {
    expect(selectNotebookPeople(definition, state({ anna_interviewed: true }))).toEqual([]);
    const people = selectNotebookPeople(
      definition,
      state({ anna_q1_read: true, anna_interviewed: true }),
    );
    expect(people).toHaveLength(1);
    expect(people[0]?.status).toBe('complete');
    expect(people[0]?.statements.map(({ id }) => id)).toEqual(['entry', 'answer1']);
  });

  it('keeps historical David and hides unlocked unread branch', () => {
    const flags = {
      david_statement_read: true,
      david_answer3_recorded: true,
      contradiction_found: true,
    };
    const tree = definition.dialogues.find(({ npcId }) => npcId === 'david')!;
    const ordinary = tree.nodes.find(({ id }) => id === 'answer3')!;
    // Use the actual branch predicate to construct the historical state.
    const condition = ordinary.condition!;
    expect(condition).toEqual({ type: 'flag', key: 'david_contradiction_found', value: false });
    const progress = state({ ...flags, david_contradiction_found: true });
    expect(evaluateCondition(progress, condition)).toBe(false);
    expect(selectNotebookPeople(definition, progress)[0]?.statements.map(({ id }) => id)).toEqual([
      'entry',
      'answer3',
    ]);
    expect(
      selectNotebookPeople(definition, {
        ...progress,
        flags: { ...progress.flags, david_answer3_unlocked_recorded: true },
      })[0]?.statements.map(({ id }) => id),
    ).toEqual(['entry', 'answer3', 'answer3_unlocked']);
  });

  it('does not infer legacy q3 branch', () => {
    const people = selectNotebookPeople(
      definition,
      state({
        david_q3_read: true,
        david_interviewed: true,
        david_contradiction_found: true,
        david_statement_read: true,
        david_q1_read: true,
      }),
    );
    expect(people[0]?.status).toBe('complete');
    expect(people[0]?.statements.map(({ id }) => id)).toEqual(['entry', 'answer1']);
  });

  it('uses node references without mutating progress', () => {
    const content = freeze(structuredClone(definition));
    const progress = freeze(
      state({ david_statement_read: true, leo_q3_read: true, anna_q1_read: true }),
    );
    const before = structuredClone(progress);
    const people = selectNotebookPeople(content, progress);
    expect(people.map(({ npc }) => npc.id)).toEqual(['anna', 'leo', 'david']);
    for (const person of people) {
      expect(person.npc).toBe(content.npcs.find(({ id }) => id === person.npc.id));
      const tree = content.dialogues.find(({ id }) => id === person.treeId)!;
      expect(tree.npcId).toBe(person.npc.id);
      for (const statement of person.statements)
        expect(statement).toBe(tree.nodes.find(({ id }) => id === statement.id));
    }
    expect(progress).toEqual(before);
  });
});
