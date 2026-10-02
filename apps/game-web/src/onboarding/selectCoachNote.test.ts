import { describe, expect, it } from 'vitest';
import { completedNotes, selectCoachNote, type CoachProgress } from './selectCoachNote';
import { allOnboardingSeen } from './onboardingTypes';

const base = (over: Partial<CoachProgress> = {}): CoachProgress => ({
  seen: allOnboardingSeen(false),
  moved: false,
  nearbyShown: false,
  interacted: false,
  hasEvidence: false,
  hasFacts: false,
  notebookOpened: false,
  boardOpened: false,
  modalOpen: false,
  ...over,
});

describe('selectCoachNote', () => {
  it('starts with move', () => {
    expect(selectCoachNote(base())).toBe('move');
  });
  it('treats an already-performed move as done, not as a pending note', () => {
    const progress = base({ moved: true });
    expect(completedNotes(progress)).toContain('move');
    expect(selectCoachNote(progress)).not.toBe('move');
  });
  it('shows nothing while a modal is open', () => {
    expect(selectCoachNote(base({ modalOpen: true }))).toBeNull();
  });
  it('moves on to interact once the target is near', () => {
    const seen = { ...allOnboardingSeen(false), move: true };
    expect(selectCoachNote(base({ seen }))).toBeNull();
    expect(selectCoachNote(base({ seen, nearbyShown: true }))).toBe('interact');
  });
  it('offers the notebook once there is evidence', () => {
    const seen = { move: true, interact: true, notebook: false, board: false };
    expect(selectCoachNote(base({ seen, hasEvidence: true }))).toBe('notebook');
  });
  it('never shows the notebook note when the notebook was opened first', () => {
    const progress = base({ notebookOpened: true, hasEvidence: true });
    expect(completedNotes(progress)).toContain('notebook');
    expect(selectCoachNote(progress)).not.toBe('notebook');
    expect(selectCoachNote(base({ notebookOpened: true }))).not.toBe('notebook');
  });
  it('keeps the priority order move, interact, notebook, board', () => {
    const everythingDue = base({ nearbyShown: true, hasEvidence: true, hasFacts: true });
    expect(selectCoachNote(everythingDue)).toBe('move');
    const afterMove = base({
      seen: { ...allOnboardingSeen(false), move: true },
      nearbyShown: true,
      hasEvidence: true,
      hasFacts: true,
    });
    expect(selectCoachNote(afterMove)).toBe('interact');
    expect(selectCoachNote({ ...afterMove, seen: { ...afterMove.seen, interact: true } })).toBe(
      'notebook',
    );
    expect(
      selectCoachNote({
        ...afterMove,
        seen: { move: true, interact: true, notebook: true, board: false },
      }),
    ).toBe('board');
  });
  it('does not let a note that is not due block a later one', () => {
    const seen = { ...allOnboardingSeen(false), move: true };
    expect(selectCoachNote(base({ seen, hasEvidence: true }))).toBe('notebook');
  });
  it('is silent once every note is seen', () => {
    expect(
      selectCoachNote(
        base({
          seen: allOnboardingSeen(true),
          nearbyShown: true,
          hasEvidence: true,
          hasFacts: true,
        }),
      ),
    ).toBeNull();
  });
});
