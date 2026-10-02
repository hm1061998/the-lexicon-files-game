/** Hints in priority order; the first unseen, eligible one is shown. */
export const COACH_NOTE_IDS = ['move', 'interact', 'notebook', 'board'] as const;
export type CoachNoteId = (typeof COACH_NOTE_IDS)[number];
export type OnboardingSeen = Record<CoachNoteId, boolean>;

export function allOnboardingSeen(value: boolean): OnboardingSeen {
  return { move: value, interact: value, notebook: value, board: value };
}
