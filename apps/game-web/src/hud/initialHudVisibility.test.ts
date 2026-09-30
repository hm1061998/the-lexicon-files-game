import { describe, expect, it } from 'vitest';
import { getInitialHudVisibility } from './initialHudVisibility';

describe('initial HUD visibility', () => {
  it.each([
    [959, 800],
    [960, 639],
  ])('starts compact below either threshold (%i × %i)', (w, h) => {
    expect(getInitialHudVisibility(w, h)).toEqual({
      minimapVisible: false,
      objectiveVisible: false,
    });
  });
  it('starts expanded at 960 × 640', () => {
    expect(getInitialHudVisibility(960, 640)).toEqual({
      minimapVisible: true,
      objectiveVisible: true,
    });
  });
});
