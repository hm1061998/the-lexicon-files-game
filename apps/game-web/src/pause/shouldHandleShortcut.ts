import { isTypingTarget } from '../game/systems/input';

/** True when `event` is `key` and focus is not in a text field. */
export function shouldHandleShortcut(
  event: { key: string; target: Element | null },
  key: string,
): boolean {
  return event.key === key && !isTypingTarget(event.target);
}
