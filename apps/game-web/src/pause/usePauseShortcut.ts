import { useEffect } from 'react';
import type { GameStore } from '../state/gameStore';
import { shouldHandleShortcut } from './shouldHandleShortcut';

type EscapeEvent = { key: string; target: Element | null; preventDefault(): void };

export function handleEscapeShortcut(store: GameStore, event: EscapeEvent): void {
  if (!shouldHandleShortcut(event, 'Escape')) return;
  event.preventDefault();
  const state = store.getState();
  if (state.activeEvidenceId !== null) state.closeEvidence();
  else if (state.notebookOpen) state.toggleNotebook();
  else state.togglePause();
}

/** Esc toggles pause; ignored while typing. Sole owner of the Esc shortcut. */
export function usePauseShortcut(store: GameStore): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      const target = event.target instanceof Element ? event.target : null;
      handleEscapeShortcut(store, {
        key: event.key,
        target,
        preventDefault: () => event.preventDefault(),
      });
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [store]);
}
