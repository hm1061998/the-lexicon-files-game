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

/** A small paper note: announces itself politely, never takes focus. */
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
    <aside role="status" aria-live="polite" className="coach-note" data-note={noteId}>
      <p>{coachText(strings, noteId)}</p>
      <button type="button" onClick={onDismiss}>
        {strings.coachDismiss}
      </button>
    </aside>
  );
}
