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

/** L opens or closes the conversation log; the store refuses it while another modal is open. */
export function handleDialogueLogShortcut(store: GameStore, event: ShortcutEvent): void {
  if (!shouldHandleShortcut(event, 'l')) return;
  const before = store.getState().dialogueLogOpen;
  store.getState().toggleDialogueLog();
  if (store.getState().dialogueLogOpen !== before) event.preventDefault();
}

export function useDialogueLogShortcut(store: GameStore): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      const target = event.target instanceof Element ? event.target : null;
      handleDialogueLogShortcut(store, {
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
