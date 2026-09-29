import { describe, expect, it } from 'vitest';
import { loadCaseDefinition } from '@lexicon/game-content';
import { createCaseState } from '../case/createCaseState';
import { applyEffects } from '../effect/applyEffects';
import { answerListeningTask } from './answerListeningTask';

const definition = loadCaseDefinition('case-001');
const taskId = 'leo_phone_recording_location';
const task = definition.listeningTasks[0]!;
const initialState = applyEffects(definition, createCaseState(definition), [
  { type: 'addEvidence', evidenceId: task.evidenceId },
]);

if (!initialState.ok) throw new Error('expected audio evidence to be valid');

describe('answerListeningTask', () => {
  it('answers the Leo task correctly and unlocks the authored fact', () => {
    const result = answerListeningTask(definition, initialState.state, taskId, 'outside');

    expect(result).toMatchObject({ ok: true, correct: true });
    if (!result.ok) return;
    expect(result.state.flags[task.completionFlag]).toBe(true);
    expect(result.state.discoveredFactIds).toContain('leo_outside_at_2029');
    expect(result.events).toContainEqual({ type: 'factUnlocked', factId: 'leo_outside_at_2029' });
  });

  it('wrong answer leaves case state unchanged', () => {
    const result = answerListeningTask(definition, initialState.state, taskId, 'inside');

    expect(result).toEqual({
      ok: true,
      correct: false,
      state: initialState.state,
      events: [],
    });
  });

  it('returns typed errors for unknown task and option', () => {
    expect(answerListeningTask(definition, initialState.state, 'missing_task', 'outside')).toEqual({
      ok: false,
      state: initialState.state,
      error: { code: 'unknownListeningTask', id: 'missing_task' },
    });
    expect(answerListeningTask(definition, initialState.state, taskId, 'missing_option')).toEqual({
      ok: false,
      state: initialState.state,
      error: { code: 'unknownListeningOption', id: 'missing_option' },
    });
  });

  it('repeating a correct answer does not duplicate events or facts', () => {
    const first = answerListeningTask(definition, initialState.state, taskId, 'outside');
    if (!first.ok) throw new Error('expected correct answer');

    const repeated = answerListeningTask(definition, first.state, taskId, 'outside');

    expect(repeated).toMatchObject({ ok: true, correct: true, events: [] });
    if (!repeated.ok) return;
    expect(repeated.state).toBe(first.state);
    expect(repeated.state.discoveredFactIds.filter((id) => id === 'leo_outside_at_2029')).toHaveLength(
      1,
    );
  });
});
