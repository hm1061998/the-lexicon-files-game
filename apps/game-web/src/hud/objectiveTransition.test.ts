import { describe, expect, it } from 'vitest';
import { clearLeaving, nextObjectiveDisplay, type ObjectiveDisplay } from './objectiveTransition';

const a = { id: 'a', text: 'First' };
const b = { id: 'b', text: 'Second' };
const empty: ObjectiveDisplay = { current: null, leaving: null };

describe('nextObjectiveDisplay', () => {
  it('shows the first objective without a leaving one', () => {
    expect(nextObjectiveDisplay(empty, a)).toEqual({ current: a, leaving: null });
  });

  it('keeps the same objective untouched', () => {
    const shown: ObjectiveDisplay = { current: a, leaving: null };
    expect(nextObjectiveDisplay(shown, { ...a })).toBe(shown);
  });

  it('moves the old objective to leaving when the id changes', () => {
    expect(nextObjectiveDisplay({ current: a, leaving: null }, b)).toEqual({
      current: b,
      leaving: a,
    });
  });

  it('moves the old objective to leaving when there is no active objective', () => {
    expect(nextObjectiveDisplay({ current: a, leaving: null }, null)).toEqual({
      current: null,
      leaving: a,
    });
  });

  it('stays empty when nothing was shown and nothing is active', () => {
    expect(nextObjectiveDisplay(empty, null)).toEqual(empty);
  });
});

describe('clearLeaving', () => {
  it('drops only the leaving objective', () => {
    expect(clearLeaving({ current: b, leaving: a })).toEqual({ current: b, leaving: null });
  });
});
