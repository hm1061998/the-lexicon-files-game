import { isTypingTarget } from '../game/systems/input';

export type ShortcutKeyEvent = {
  key: string;
  target: Element | null;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
};

/**
 * True when `event` is `key`, focus is not in a text field and no Ctrl/Meta/Alt is held, so
 * browser and OS combos (Ctrl+J downloads, Cmd+M minimise, Alt+Esc) never trigger a game
 * shortcut. Shift is deliberately allowed: it does not change what these keys mean here.
 */
export function shouldHandleShortcut(event: ShortcutKeyEvent, key: string): boolean {
  if (event.ctrlKey || event.metaKey || event.altKey) return false;
  return event.key === key && !isTypingTarget(event.target);
}
