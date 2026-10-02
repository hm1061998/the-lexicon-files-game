import { InkButton, PaperSheet } from '@lexicon/ui';
import type { UiStrings } from '@lexicon/shared-types';
import type { CoachNoteId } from './onboardingTypes';
import './coach.css';

export function coachText(strings: UiStrings, noteId: CoachNoteId): string {
  switch (noteId) {
    case 'move':
      return strings.coachMove;
    case 'interact':
      return strings.coachInteract;
    case 'notebook':
      return strings.coachNotebook;
    case 'board':
      return strings.coachBoard;
  }
}

/** A handwritten sticky note taped to the screen: announces itself politely, never takes focus. */
export function CoachNote({
  strings,
  noteId,
  onDismiss,
}: {
  strings: UiStrings;
  noteId: CoachNoteId;
  onDismiss: () => void;
}): JSX.Element {
  return (
    <PaperSheet
      as="aside"
      tape="tr"
      tilt={-0.8}
      className="coach-note"
      role="status"
      aria-live="polite"
      data-note={noteId}
    >
      <p>{coachText(strings, noteId)}</p>
      <InkButton onClick={onDismiss}>{strings.coachDismiss}</InkButton>
    </PaperSheet>
  );
}
