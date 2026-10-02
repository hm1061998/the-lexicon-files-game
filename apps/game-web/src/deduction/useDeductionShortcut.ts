import { useEffect } from 'react';
import type { GameStore } from '../state/gameStore';
import { shouldHandleShortcut, type ShortcutKeyEvent } from '../pause/shouldHandleShortcut';
export function handleDeductionShortcut(
  store: GameStore,
  event: ShortcutKeyEvent & { preventDefault(): void },
): void {
  if (!shouldHandleShortcut(event, 'b')) return;
  const state = store.getState();
  if (
    state.paused ||
    state.activeEvidenceId ||
    state.dialogueSession ||
    state.caseState.flags.case_closed
  )
    return;
  event.preventDefault();
  state.toggleDeduction();
}
export function useDeductionShortcut(store: GameStore): void {
  useEffect(() => {
    const handler = (event: KeyboardEvent) =>
      handleDeductionShortcut(store, {
        key: event.key.toLowerCase(),
        target: event.target instanceof Element ? event.target : null,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        altKey: event.altKey,
        preventDefault: () => event.preventDefault(),
      });
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [store]);
}
