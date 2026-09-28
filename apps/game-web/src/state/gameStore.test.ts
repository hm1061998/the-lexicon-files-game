import { describe, expect, it } from 'vitest';
import type { CaseSummary } from '@lexicon/shared-types';
import { createGameStore } from './gameStore';

const caseSummary: CaseSummary = {
  id: 'case-test',
  title: 'Test Case',
  evidenceTotal: 5,
  initialObjective: { id: 'obj-1', text: 'Do the thing' },
};

describe('createGameStore', () => {
  it('initializes from case summary', () => {
    const store = createGameStore({ caseSummary });
    const state = store.getState();

    expect(state.caseTitle).toBe('Test Case');
    expect(state.currentObjective?.text).toBe('Do the thing');
    expect(state.evidenceCollected).toBe(0);
    expect(state.evidenceTotal).toBe(5);
    expect(state.nearby).toBeNull();
    expect(state.paused).toBe(false);
    expect(state.inputLocked).toBe(false);
  });

  it('setNearby stores id and prompt', () => {
    const store = createGameStore({ caseSummary });

    store.getState().setNearby({ id: 'note', prompt: 'Read the note' });

    expect(store.getState().nearby).toEqual({ id: 'note', prompt: 'Read the note' });
  });

  it('togglePause flips paused and inputLocked', () => {
    const store = createGameStore({ caseSummary });

    store.getState().togglePause();
    expect(store.getState().paused).toBe(true);
    expect(store.getState().inputLocked).toBe(true);

    store.getState().togglePause();
    expect(store.getState().paused).toBe(false);
    expect(store.getState().inputLocked).toBe(false);
  });

  it('setPaused(false) unlocks input', () => {
    const store = createGameStore({ caseSummary });

    store.getState().setPaused(true);
    expect(store.getState().inputLocked).toBe(true);

    store.getState().setPaused(false);
    expect(store.getState().paused).toBe(false);
    expect(store.getState().inputLocked).toBe(false);
  });
});
