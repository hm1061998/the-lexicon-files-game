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

/** M toggles the minimap; ignored while typing and (via the store) while input is locked. */
export function handleMinimapShortcut(store: GameStore, event: ShortcutEvent): void {
  if (!shouldHandleShortcut(event, 'm')) return;
  if (store.getState().inputLocked) return;
  event.preventDefault();
  store.getState().toggleMinimap();
}

export function useMinimapShortcut(store: GameStore): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      const target = event.target instanceof Element ? event.target : null;
      handleMinimapShortcut(store, {
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
