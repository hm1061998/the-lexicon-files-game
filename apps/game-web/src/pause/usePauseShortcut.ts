import { useEffect } from 'react';
import type { GameStore } from '../state/gameStore';
import { shouldHandleShortcut } from './shouldHandleShortcut';

/** Esc toggles pause; ignored while typing. Sole owner of the Esc shortcut. */
export function usePauseShortcut(store: GameStore): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      const target = event.target instanceof Element ? event.target : null;
      if (!shouldHandleShortcut({ key: event.key, target }, 'Escape')) return;
      event.preventDefault();
      store.getState().togglePause();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [store]);
}
