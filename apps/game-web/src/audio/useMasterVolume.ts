import { useEffect } from 'react';
import { Howler } from 'howler';

/** Applies the 0-100 settings volume to the global Howler master volume. */
export function useMasterVolume(volume: number): void {
  useEffect(() => {
    Howler.volume(Math.min(1, Math.max(0, volume / 100)));
  }, [volume]);
}
