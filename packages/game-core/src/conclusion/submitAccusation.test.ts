import { describe, expect, it } from 'vitest';
import { loadCaseDefinition } from '@lexicon/game-content';
import type { CaseDefinition, GameState } from '@lexicon/shared-types';
import { createCaseState } from '../case/createCaseState';
import { submitAccusation } from './submitAccusation';

const definition = loadCaseDefinition('case-001');
const conclusion = definition.conclusion!;
const wrongSuspect = conclusion.suspectNpcIds.find((id) => id !== conclusion.correctSuspectNpcId)!;

function readyState(): GameState {
  const base = createCaseState(definition);
  return {
    ...base,
    discoveredFactIds: ['david_took_report'],
    flags: { david_confession_read: true, anna_interviewed: true },
    objectiveStatuses: { ...base.objectiveStatuses, [conclusion.objectiveId]: 'active' },
  };
}

describe('submitAccusation', () => {
  it('keeps the exact input state and emits nothing for a wrong suspect', () => {
    const state = readyState();
    const result = submitAccusation(definition, state, wrongSuspect);
    expect(result).toEqual({ ok: true, correct: false, state, events: [] });
    expect(result.state).toBe(state);
  });

  it('allows retrying after a wrong accusation', () => {
    const wrong = submitAccusation(definition, readyState(), wrongSuspect);
    const right = submitAccusation(definition, wrong.state, conclusion.correctSuspectNpcId);
    expect(right.ok && right.correct).toBe(true);
  });

  it('closes the case and completes the objective for the correct suspect', () => {
    const state = readyState();
    expect(submitAccusation(definition, state, conclusion.correctSuspectNpcId)).toEqual({
      ok: true,
      correct: true,
      state: {
        ...state,
        flags: { ...state.flags, case_closed: true },
        objectiveStatuses: { ...state.objectiveStatuses, [conclusion.objectiveId]: 'completed' },
      },
      events: [
        { type: 'objectiveCompleted', objectiveId: conclusion.objectiveId },
        { type: 'flagChanged', key: 'case_closed', value: true },
      ],
    });
  });

  it('is idempotent when the correct suspect is submitted again after closing', () => {
    const closed = submitAccusation(definition, readyState(), conclusion.correctSuspectNpcId);
    const again = submitAccusation(definition, closed.state, conclusion.correctSuspectNpcId);
    expect(again).toEqual({ ok: true, correct: true, state: closed.state, events: [] });
    expect(again.state).toBe(closed.state);
  });

  it('rejects a different suspect after the case is closed without changing state', () => {
    const closed = submitAccusation(definition, readyState(), conclusion.correctSuspectNpcId);
    expect(submitAccusation(definition, closed.state, wrongSuspect)).toEqual({
      ok: false,
      state: closed.state,
      error: { code: 'caseAlreadyClosed', id: definition.id },
    });
  });

  it('rejects a suspect that is not declared by the case', () => {
    const state = readyState();
    expect(submitAccusation(definition, state, 'ghost')).toEqual({
      ok: false,
      state,
      error: { code: 'unknownSuspect', id: 'ghost' },
    });
  });

  it('rejects an accusation while the conclusion objective is not active', () => {
    const state = createCaseState(definition);
    expect(submitAccusation(definition, state, conclusion.correctSuspectNpcId)).toEqual({
      ok: false,
      state,
      error: { code: 'objectiveNotActive', id: conclusion.objectiveId },
    });
  });

  it('rejects an accusation for a case without a conclusion contract', () => {
    const withoutConclusion: CaseDefinition = { ...definition, conclusion: undefined };
    const state = readyState();
    expect(submitAccusation(withoutConclusion, state, 'david')).toEqual({
      ok: false,
      state,
      error: { code: 'unknownSuspect', id: 'david' },
    });
  });
});
