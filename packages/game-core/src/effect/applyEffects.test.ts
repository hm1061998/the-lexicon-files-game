import { describe, expect, it } from 'vitest';
import type { CaseDefinition, GameState } from '@lexicon/shared-types';
import { createCaseState } from '../case/createCaseState';
import { applyEffects } from './applyEffects';

const definition = {
  id: 'case-test',
  title: 'Effect Test',
  evidenceTotal: 1,
  initialObjectiveId: 'first',
  scenes: [],
  npcs: [],
  dialogues: [],
  evidences: [
    {
      id: 'note',
      caseId: 'case-test',
      name: 'Note',
      category: 'document',
      description: 'A note.',
      relatedFactIds: ['note_fact'],
    },
  ],
  facts: [
    {
      id: 'note_fact',
      text: 'The note exists.',
      sourceEvidenceIds: ['note'],
      unlockCondition: { type: 'hasEvidence', evidenceId: 'note' },
    },
    {
      id: 'chained_fact',
      text: 'The note fact is known.',
      sourceEvidenceIds: ['note'],
      unlockCondition: { type: 'hasFact', factId: 'note_fact' },
    },
  ],
  objectives: [
    { id: 'first', text: 'First.' },
    { id: 'second', text: 'Second.' },
  ],
  vocabulary: [],
  vocabularyContexts: [],
  listeningTasks: [],
  timeline: { slots: [], events: [] },
  contradictions: [],
} as unknown as CaseDefinition;

const start = (): GameState => createCaseState(definition);

describe('applyEffects error paths', () => {
  it.each([
    ['unknownObjective', { type: 'completeObjective', objectiveId: 'missing' }, 'missing'],
    ['objectiveNotActive', { type: 'completeObjective', objectiveId: 'second' }, 'second'],
    ['unknownObjective', { type: 'activateObjective', objectiveId: 'missing' }, 'missing'],
  ] as const)('returns %s without changing state', (code, effect, id) => {
    const state = start();
    const result = applyEffects(definition, state, [effect]);
    expect(result).toEqual({ ok: false, state, error: { code, id } });
    expect(result.state).toBe(state);
  });

  it('rejects completing an objective twice and activating a completed one', () => {
    const done = applyEffects(definition, start(), [
      { type: 'completeObjective', objectiveId: 'first' },
    ]);
    if (!done.ok) throw new Error('setup failed');
    for (const type of ['completeObjective', 'activateObjective'] as const) {
      const result = applyEffects(definition, done.state, [{ type, objectiveId: 'first' }]);
      expect(result).toMatchObject({
        ok: false,
        error: { code: 'objectiveAlreadyCompleted', id: 'first' },
      });
      expect(result.state).toBe(done.state);
    }
  });

  it('discards earlier effects of a batch when a later one fails', () => {
    const state = start();
    const result = applyEffects(definition, state, [
      { type: 'addEvidence', evidenceId: 'note' },
      { type: 'completeObjective', objectiveId: 'second' },
    ]);
    expect(result.ok).toBe(false);
    expect(result.state).toBe(state);
    expect(state.evidenceIds).toEqual([]);
  });
});

describe('applyEffects state handling', () => {
  it('is idempotent: re-applying the same effects emits no events and keeps the state reference', () => {
    const effects = [
      { type: 'addEvidence', evidenceId: 'note' },
      { type: 'setFlag', key: 'seen', value: true },
      { type: 'activateObjective', objectiveId: 'first' },
    ] as const;
    const first = applyEffects(definition, start(), effects);
    if (!first.ok) throw new Error('setup failed');
    const second = applyEffects(definition, first.state, effects);
    expect(second).toEqual({ ok: true, state: first.state, events: [] });
    expect(second.state).toBe(first.state);
  });

  it('unlocks chained facts in one call', () => {
    const result = applyEffects(definition, start(), [{ type: 'addEvidence', evidenceId: 'note' }]);
    if (!result.ok) throw new Error('setup failed');
    expect(result.state.discoveredFactIds).toEqual(['note_fact', 'chained_fact']);
  });

  it('never mutates the input state', () => {
    const state = start();
    const snapshot = structuredClone(state);
    applyEffects(definition, state, [
      { type: 'addEvidence', evidenceId: 'note' },
      { type: 'setFlag', key: 'seen', value: true },
      { type: 'completeObjective', objectiveId: 'first' },
    ]);
    expect(state).toEqual(snapshot);
  });
});
