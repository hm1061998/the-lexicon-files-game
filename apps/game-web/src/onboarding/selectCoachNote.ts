import { COACH_NOTE_IDS, type CoachNoteId, type OnboardingSeen } from './onboardingTypes';

export type CoachProgress = {
  seen: OnboardingSeen;
  moved: boolean;
  nearbyShown: boolean;
  interacted: boolean;
  hasEvidence: boolean;
  hasFacts: boolean;
  notebookOpened: boolean;
  boardOpened: boolean;
  modalOpen: boolean;
};

const performed: Record<CoachNoteId, (p: CoachProgress) => boolean> = {
  move: (p) => p.moved,
  interact: (p) => p.interacted,
  notebook: (p) => p.notebookOpened,
  board: (p) => p.boardOpened,
};

const eligible: Record<CoachNoteId, (p: CoachProgress) => boolean> = {
  move: () => true,
  interact: (p) => p.nearbyShown,
  notebook: (p) => p.hasEvidence,
  board: (p) => p.hasFacts,
};

/** Notes whose action already happened before the note was due: they are done, never shown. */
export function completedNotes(progress: CoachProgress): CoachNoteId[] {
  return COACH_NOTE_IDS.filter((id) => !progress.seen[id] && performed[id](progress));
}

/** At most one note, by priority; a note that is not yet due does not block a later one. */
export function selectCoachNote(progress: CoachProgress): CoachNoteId | null {
  if (progress.modalOpen) return null;
  return (
    COACH_NOTE_IDS.find(
      (id) => !progress.seen[id] && !performed[id](progress) && eligible[id](progress),
    ) ?? null
  );
}
