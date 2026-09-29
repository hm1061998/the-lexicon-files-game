import { describe, expect, it } from 'vitest';
import { PAPER_OVERLAY_ALPHA, PAPER_OVERLAY_KEY, SCENE_FADE_MS } from './constants';

describe('paper overlay and fade constants', () => {
  it('keeps overlay alpha within the 0.10-0.18 art spec range', () => {
    expect(PAPER_OVERLAY_ALPHA).toBeGreaterThanOrEqual(0.1);
    expect(PAPER_OVERLAY_ALPHA).toBeLessThanOrEqual(0.18);
  });

  it('keeps the scene fade between 200 and 300 ms', () => {
    expect(SCENE_FADE_MS).toBeGreaterThanOrEqual(200);
    expect(SCENE_FADE_MS).toBeLessThanOrEqual(300);
  });

  it('exposes the overlay texture key', () => {
    expect(PAPER_OVERLAY_KEY).toBe('paper_overlay');
  });
});
