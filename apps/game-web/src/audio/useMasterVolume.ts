import { useEffect } from 'react';
import { Howler } from 'howler';

/** Maps the 0-100 settings volume to a clamped 0-1 Howler gain. */
export function masterVolumeGain(volume: number): number {
  return Math.min(1, Math.max(0, volume / 100));
}

/** Idempotent, so React StrictMode's double effect run is harmless. */
export function applyMasterVolume(volume: number): void {
  Howler.volume(masterVolumeGain(volume));
}

/** Applies the 0-100 settings volume to the global Howler master volume. */
export function useMasterVolume(volume: number): void {
  useEffect(() => {
    applyMasterVolume(volume);
  }, [volume]);
}
