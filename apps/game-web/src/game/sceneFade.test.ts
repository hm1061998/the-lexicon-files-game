import { describe, expect, it } from 'vitest';
import { SCENE_FADE_MS } from './constants';

describe('scene fade constant', () => {
  it('keeps the scene fade between 200 and 300 ms', () => {
    expect(SCENE_FADE_MS).toBeGreaterThanOrEqual(200);
    expect(SCENE_FADE_MS).toBeLessThanOrEqual(300);
  });
});
