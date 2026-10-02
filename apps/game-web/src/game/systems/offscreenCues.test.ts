import { describe, expect, it } from 'vitest';
import { OFFSCREEN_MARGIN, OFFSCREEN_MAX, offscreenCues } from './offscreenCues';

const view = { x: 0, y: 0, width: 1000, height: 600 };
const player = { x: 500, y: 300 };
const noInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const call = (cues: { id: string; x: number; y: number }[], insets = noInsets) =>
  offscreenCues({ cues, view, player, insets, margin: OFFSCREEN_MARGIN, max: OFFSCREEN_MAX });

describe('offscreenCues', () => {
  it('uses a 24px margin and at most three pointers', () => {
    expect(OFFSCREEN_MARGIN).toBe(24);
    expect(OFFSCREEN_MAX).toBe(3);
  });

  it('returns nothing for cues inside the view', () => {
    expect(call([{ id: 'a', x: 700, y: 200 }])).toEqual([]);
  });

  it('puts a cue to the right on the right margin, pointing right', () => {
    const [pointer] = call([{ id: 'a', x: 1600, y: 300 }]);
    expect(pointer).toMatchObject({ id: 'a', x: view.width - 24 });
    expect(pointer!.y).toBeCloseTo(300, 5);
    expect(pointer!.angle).toBeCloseTo(0, 5);
  });

  it('keeps pointers clear of HUD insets', () => {
    const [pointer] = call([{ id: 'a', x: 1600, y: 300 }], { ...noInsets, right: 240 });
    expect(pointer!.x).toBe(view.width - 240 - 24);
    const [top] = call([{ id: 'b', x: 500, y: -900 }], { ...noInsets, top: 120 });
    expect(top!.y).toBe(120 + 24);
  });

  it('points along the ray from the player to the cue', () => {
    // Slope 0.6: the bottom margin (y = 576) is reached before the right one (x = 976).
    const [pointer] = call([{ id: 'a', x: 1500, y: 900 }]);
    expect(pointer!.y).toBeCloseTo(576, 5);
    expect(pointer!.x).toBeCloseTo(500 + (276 / 600) * 1000, 5);
    expect(pointer!.angle).toBeCloseTo(Math.atan2(600, 1000), 5);
  });

  it('keeps only the three nearest of five outside cues, nearest first', () => {
    const cues = [
      { id: 'far', x: 5000, y: 300 },
      { id: 'c3', x: 2500, y: 300 },
      { id: 'c1', x: 1200, y: 300 },
      { id: 'c2', x: 1800, y: 300 },
      { id: 'c4', x: 3500, y: 300 },
    ];
    expect(call(cues).map(({ id }) => id)).toEqual(['c1', 'c2', 'c3']);
  });

  it('ignores a cue that is inside the view even if it sits under the HUD', () => {
    expect(call([{ id: 'a', x: 500, y: 20 }], { ...noInsets, top: 120 })).toEqual([]);
  });
});
