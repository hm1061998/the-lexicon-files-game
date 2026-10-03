import { useEffect } from 'react';
import { sfxForEvent, type UiSound } from './uiSound';

/**
 * One pair of capture listeners plays the sound of whichever `[data-sfx]` control is pressed:
 * pointer down, or Enter/Space on the focused control. Nothing plays on hover.
 */
export function useUiSoundDelegation(root: Document | HTMLElement | null, uiSound: UiSound | null) {
  useEffect(() => {
    if (!root || !uiSound) return undefined;
    const onPointer = (event: Event) => {
      const id = sfxForEvent(event.target);
      if (id) uiSound.play(id);
    };
    const onKey = (event: Event) => {
      const key = (event as KeyboardEvent).key;
      if ((key !== 'Enter' && key !== ' ') || (event as KeyboardEvent).repeat) return;
      const id = sfxForEvent(event.target);
      if (id) uiSound.play(id);
    };
    root.addEventListener('pointerdown', onPointer, true);
    root.addEventListener('keydown', onKey, true);
    return () => {
      root.removeEventListener('pointerdown', onPointer, true);
      root.removeEventListener('keydown', onKey, true);
    };
  }, [root, uiSound]);
}
