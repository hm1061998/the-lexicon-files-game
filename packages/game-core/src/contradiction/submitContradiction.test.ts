import { describe, expect, it } from 'vitest';
import { loadCaseDefinition } from '@lexicon/game-content';
import { createCaseState } from '../case/createCaseState';
import { submitContradiction } from './submitContradiction';

const definition = loadCaseDefinition('case-001');
const contradictionId = 'david_statement_vs_access_log';
const statementFactId = 'david_statement_no_entry_after_20_00';
const entryFactId = 'david_entry_20_32';

function stateWithContradictionFacts() {
  return {
    ...createCaseState(definition),
    discoveredFactIds: [statementFactId, entryFactId],
  };
}

describe('submitContradiction', () => {
  it('accepts the declared fact pair and completes the authored objective', () => {
    const state = stateWithContradictionFacts();

    const result = submitContradiction(definition, state, contradictionId, [
      statementFactId,
      entryFactId,
    ]);

    expect(result).toEqual({
      ok: true,
      correct: true,
      state: {
        ...state,
        flags: { david_contradiction_found: true },
        objectiveStatuses: {
          ...state.objectiveStatuses,
          compare_david_statement: 'completed',
        },
        contradictionIds: [contradictionId],
      },
      events: [
        { type: 'flagChanged', key: 'david_contradiction_found', value: true },
        { type: 'objectiveCompleted', objectiveId: 'compare_david_statement' },
      ],
    });
  });

  it('accepts the declared pair regardless of the selection order', () => {
    const state = stateWithContradictionFacts();

    const result = submitContradiction(definition, state, contradictionId, [
      entryFactId,
      statementFactId,
    ]);

    expect(result).toMatchObject({ ok: true, correct: true });
  });

  it('keeps state unchanged after an incorrect pair so the player can retry', () => {
    const state = {
      ...stateWithContradictionFacts(),
      discoveredFactIds: [statementFactId, entryFactId, 'meeting_started', 'leo_outside_at_2029'],
    };

    const result = submitContradiction(definition, state, contradictionId, [
      'meeting_started',
      'leo_outside_at_2029',
    ]);

    expect(result).toEqual({ ok: true, correct: false, state, events: [] });
    if (result.ok) expect(result.state).toBe(state);
  });

  it('requires both contradiction facts to be discovered', () => {
    const state = createCaseState(definition);

    expect(
      submitContradiction(definition, state, contradictionId, [statementFactId, entryFactId]),
    ).toEqual({
      ok: false,
      state,
      error: { code: 'contradictionUnavailable', id: contradictionId },
    });
  });

  it('rejects hidden and unknown selected facts with typed errors', () => {
    const state = stateWithContradictionFacts();

    expect(
      submitContradiction(definition, state, contradictionId, [statementFactId, 'meeting_started']),
    ).toEqual({
      ok: false,
      state,
      error: { code: 'factNotDiscovered', id: 'meeting_started' },
    });
    expect(
      submitContradiction(definition, state, contradictionId, [statementFactId, 'unknown_fact']),
    ).toEqual({
      ok: false,
      state,
      error: { code: 'unknownFact', id: 'unknown_fact' },
    });
  });

  it('returns a typed error for an unknown contradiction ID', () => {
    const state = stateWithContradictionFacts();

    expect(submitContradiction(definition, state, 'unknown_contradiction', [])).toEqual({
      ok: false,
      state,
      error: { code: 'unknownContradiction', id: 'unknown_contradiction' },
    });
  });

  it('is idempotent when the correct pair is submitted again', () => {
    const state = stateWithContradictionFacts();
    const first = submitContradiction(definition, state, contradictionId, [
      statementFactId,
      entryFactId,
    ]);
    if (!first.ok) throw new Error('expected a correct contradiction');

    const repeated = submitContradiction(definition, first.state, contradictionId, [
      entryFactId,
      statementFactId,
    ]);

    expect(repeated).toEqual({
      ok: true,
      correct: true,
      state: first.state,
      events: [],
    });
  });
});
