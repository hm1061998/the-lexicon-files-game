import { describe, expect, it } from 'vitest';
import { loadCaseDefinition } from '@lexicon/game-content';
import { createCaseState } from '../case/createCaseState';
import { reconcileDialogueProgress } from '../dialogue/reconcileDialogueProgress';
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

  it('unlocks objectives that depend on the completed comparison without another dialogue', () => {
    const second = loadCaseDefinition('case-002');
    const facts = [
      'leo_statement_at_desk_all_afternoon',
      'leo_entry_16_40',
      'leo_blames_anna_wrong_number',
      'label_reprinted_16_44',
    ];
    // As in play: the facts were learned in dialogue and evidence, and the last dialogue reconciled.
    const reconciled = reconcileDialogueProgress(second, {
      ...createCaseState(second),
      discoveredFactIds: facts,
    });
    if (!reconciled.ok) throw new Error('reconcile failed');
    const start = reconciled.state;
    expect(start.objectiveStatuses.compare_leo_desk_statement).toBe('active');
    expect(start.objectiveStatuses.submit_your_conclusion).toBe('locked');

    const first = submitContradiction(second, start, 'leo_desk_vs_access_log', facts.slice(0, 2));
    if (!first.ok) throw new Error('first comparison failed');
    expect(first.state.objectiveStatuses.submit_your_conclusion).toBe('locked');
    const done = submitContradiction(second, first.state, 'leo_blame_vs_label_log', facts.slice(2));
    if (!done.ok) throw new Error('second comparison failed');

    expect(done.state.objectiveStatuses).toMatchObject({
      compare_leo_desk_statement: 'completed',
      compare_leo_blame_statement: 'completed',
      submit_your_conclusion: 'active',
    });
    expect(done.events).toContainEqual({
      type: 'objectiveActivated',
      objectiveId: 'submit_your_conclusion',
    });
  });
});
