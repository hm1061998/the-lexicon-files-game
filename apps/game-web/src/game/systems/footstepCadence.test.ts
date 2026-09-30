import { describe, expect, it } from 'vitest';
import { advanceFootstep } from './footstepCadence';

describe('footstep cadence', () => {
  it('uses traveled pixels, not frame count, at 30/60/120 fps', () => {
    const counts = [30, 60, 120].map((fps) => {
      let state = { distancePx: 0 };
      let emitted = 0;
      for (let i = 0; i < fps; i++) {
        const result = advanceFootstep(state, 1000 / fps, false);
        state = result.state;
        if (result.emit) emitted++;
      }
      return emitted;
    });
    expect(counts).toEqual([23, 23, 23]);
  });
  it('does not emit against walls and resets cadence when input is locked', () => {
    expect(advanceFootstep({ distancePx: 18 }, 0, false)).toEqual({
      state: { distancePx: 18 },
      emit: false,
    });
    expect(advanceFootstep({ distancePx: 30 }, 20, true)).toEqual({
      state: { distancePx: 0 },
      emit: false,
    });
  });
});
