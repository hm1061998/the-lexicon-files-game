import { describe, expect, it } from 'vitest';
import { loadCaseDefinition } from '@lexicon/game-content';
import { createGameStore } from './gameStore';

describe('createGameStore', () => {
  it('initializes the core case state from the case definition', () => {
    const definition = loadCaseDefinition('case-001');
    const store = createGameStore({ caseDefinition: definition });
    const state = store.getState();

    expect(state.caseDefinition).toBe(definition);
    expect(state.caseState.caseId).toBe(definition.id);
    expect(state.caseState.caseTitle).toBe(definition.title);
    expect(state.caseState.evidenceTotal).toBe(definition.evidenceTotal);
    expect(state.caseState.evidenceIds).toEqual([]);
    expect(state.caseState.objectiveStatuses[definition.initialObjectiveId]).toBe('active');
  });

  it('applies case effects through the core reducer', () => {
    const definition = loadCaseDefinition('case-001');
    const store = createGameStore({ caseDefinition: definition });

    const result = store
      .getState()
      .applyCaseEffects([
        { type: 'completeObjective', objectiveId: definition.initialObjectiveId },
      ]);

    expect(result.ok).toBe(true);
    expect(store.getState().caseState.objectiveStatuses[definition.initialObjectiveId]).toBe(
      'completed',
    );
  });
});
