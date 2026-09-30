import { describe, expect, it } from 'vitest';
import { breathing, breathingPhaseOffset } from './breathing';

describe('breathing', () => {
  it('stays within a subtle ±0.008 vertical scale and keeps horizontal scale fixed', () => {
    for (let timeMs = 0; timeMs < 10_000; timeMs += 37) {
      const result = breathing({ timeMs, phaseOffset: 0.8, walking: false, inDialogue: false, reducedMotion: false });
      expect(result.scaleX).toBe(1);
      expect(result.scaleY).toBeGreaterThanOrEqual(0.992);
      expect(result.scaleY).toBeLessThanOrEqual(1.008);
    }
  });

  it.each([
    { walking: true, inDialogue: false, reducedMotion: false },
    { walking: false, inDialogue: true, reducedMotion: false },
    { walking: false, inDialogue: false, reducedMotion: true },
  ])('snaps to neutral when inactive: %o', (state) => {
    expect(breathing({ timeMs: 1234, phaseOffset: 0.5, ...state })).toEqual({ scaleX: 1, scaleY: 1 });
  });

  it('assigns stable, distinct phase offsets by character id', () => {
    expect(breathingPhaseOffset('anna')).toBe(breathingPhaseOffset('anna'));
    expect(breathingPhaseOffset('anna')).not.toBe(breathingPhaseOffset('leo'));
  });
});
