import { describe, expect, it } from 'vitest';
import { loadCaseDefinition } from '@lexicon/game-content';
import { createCaseState } from '../case/createCaseState';
import { placeTimelineEvent } from './placeTimelineEvent';

const definition = loadCaseDefinition('case-001');

describe('placeTimelineEvent', () => {
  it('places an available event in its authored slot', () => {
    const state = createCaseState(definition);

    const result = placeTimelineEvent(definition, state, 'report_missing_21_05', '21_05');

    expect(result).toEqual({
      ok: true,
      correct: true,
      state: { ...state, timelineEventIds: ['report_missing_21_05'] },
    });
  });

  it('leaves state unchanged after an incorrect slot so the player can retry', () => {
    const state = createCaseState(definition);

    const result = placeTimelineEvent(definition, state, 'report_missing_21_05', '20_45');

    expect(result).toEqual({ ok: true, correct: false, state });
    if (result.ok) expect(result.state).toBe(state);
  });

  it('returns typed errors for unknown event and slot IDs', () => {
    const state = createCaseState(definition);

    expect(placeTimelineEvent(definition, state, 'missing_event', '21_05')).toEqual({
      ok: false,
      state,
      error: { code: 'unknownTimelineEvent', id: 'missing_event' },
    });
    expect(placeTimelineEvent(definition, state, 'report_missing_21_05', 'missing_slot')).toEqual({
      ok: false,
      state,
      error: { code: 'unknownTimelineSlot', id: 'missing_slot' },
    });
  });

  it('does not allow an event to be placed before its required fact is discovered', () => {
    const state = createCaseState(definition);

    expect(placeTimelineEvent(definition, state, 'meeting_started', '20_00')).toEqual({
      ok: false,
      state,
      error: { code: 'timelineEventUnavailable', id: 'meeting_started' },
    });
  });

  it('allows an evidence-backed event after its required fact is discovered', () => {
    const state = {
      ...createCaseState(definition),
      discoveredFactIds: ['meeting_started'],
    };

    const result = placeTimelineEvent(definition, state, 'meeting_started', '20_00');

    expect(result).toMatchObject({ ok: true, correct: true });
    if (result.ok) expect(result.state.timelineEventIds).toEqual(['meeting_started']);
  });

  it('is idempotent when the same correct event is submitted again', () => {
    const state = createCaseState(definition);
    const first = placeTimelineEvent(definition, state, 'report_missing_21_05', '21_05');
    if (!first.ok) throw new Error('expected a valid placement');

    const repeated = placeTimelineEvent(definition, first.state, 'report_missing_21_05', '21_05');

    expect(repeated).toEqual({ ok: true, correct: true, state: first.state });
  });
});
