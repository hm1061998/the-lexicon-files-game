import { useEffect } from 'react';
import type { GameStore } from '../state/gameStore';
import { shouldHandleShortcut } from '../pause/shouldHandleShortcut';

type ShortcutEvent = {
  key: string;
  target: Element | null;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  preventDefault(): void;
};

export function handleNotebookShortcut(store: GameStore, event: ShortcutEvent): void {
  if (!shouldHandleShortcut(event, 'j')) return;
  const state = store.getState();
  if (
    state.paused ||
    state.briefingOpen ||
    state.activeEvidenceId !== null ||
    state.dialogueSession !== null
  )
    return;
  event.preventDefault();
  state.toggleNotebook();
}

export function useNotebookShortcut(store: GameStore): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      const target = event.target instanceof Element ? event.target : null;
      handleNotebookShortcut(store, {
        key: event.key.toLowerCase(),
        target,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        altKey: event.altKey,
        preventDefault: () => event.preventDefault(),
      });
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [store]);
}
