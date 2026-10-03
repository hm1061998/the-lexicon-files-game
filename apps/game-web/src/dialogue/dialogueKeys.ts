export type DialogueKeyEvent = {
  key: string;
  repeat: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  target: unknown;
};

export type DialogueKeyAction = { type: 'finish' } | { type: 'choose'; index: number } | null;

const INTERACTIVE_TAGS = new Set(['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT']);

function isInteractive(target: unknown): boolean {
  const el = target as { tagName?: string; isContentEditable?: boolean } | null;
  return !!el && (INTERACTIVE_TAGS.has(el.tagName ?? '') || el.isContentEditable === true);
}

/**
 * What a key does in the conversation band. Space, Enter and E finish the line that is still
 * typing; once it is shown they take the only choice (and do nothing when there are several).
 * 1-9 take that choice. Held keys, chords and focused controls are left to the browser, so a
 * focused button is never activated twice.
 */
export function dialogueKeyAction(
  event: DialogueKeyEvent,
  state: { done: boolean; choiceCount: number },
): DialogueKeyAction {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return null;
  if (isInteractive(event.target)) return null;
  const { key } = event;
  if (key === ' ' || key === 'Enter' || key === 'e' || key === 'E') {
    if (!state.done) return { type: 'finish' };
    return state.choiceCount === 1 ? { type: 'choose', index: 0 } : null;
  }
  if (/^[1-9]$/.test(key) && state.done) {
    const index = Number(key) - 1;
    return index < state.choiceCount ? { type: 'choose', index } : null;
  }
  return null;
}
