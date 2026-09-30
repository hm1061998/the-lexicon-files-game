import { describe, expect, it } from 'vitest';
import { shouldEmitPlayerMoved } from './playerMoved';
import { projectIso } from './isometricProjection';

describe('shouldEmitPlayerMoved', () => {
  const prev = { x: 100, y: 100 };
  it('accepts a short logical step only after projecting it into world pixels', () => {
    const projection = {
      type: 'dimetric-2:1',
      originX: 832,
      originY: 180,
      tileWidth: 128,
      tileHeight: 64,
    } as const;
    const before = projectIso({ u: 10, v: 9 }, projection);
    const after = projectIso({ u: 10.2578125, v: 8.7421875 }, projection);
    expect(shouldEmitPlayerMoved(before, after, 100)).toBe(true);
    expect(shouldEmitPlayerMoved(before, after, 99)).toBe(false);
  });

  it('emits the first position immediately', () => {
    expect(shouldEmitPlayerMoved(null, { x: 5, y: 5 }, 0)).toBe(true);
  });

  it('does not emit before 100 ms have passed', () => {
    expect(shouldEmitPlayerMoved(prev, { x: 150, y: 100 }, 99)).toBe(false);
  });

  it('does not emit for a shift under 2 px', () => {
    expect(shouldEmitPlayerMoved(prev, { x: 101, y: 101 }, 500)).toBe(false);
  });

  it('emits for a shift of at least 2 px once 100 ms have passed', () => {
    expect(shouldEmitPlayerMoved(prev, { x: 102, y: 100 }, 100)).toBe(true);
    expect(shouldEmitPlayerMoved(prev, { x: 100, y: 98 }, 250)).toBe(true);
  });
});
