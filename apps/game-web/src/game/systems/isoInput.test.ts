import { describe, expect, it } from 'vitest';
import { resolveIsoInput, screenSpeedVector } from './isoInput';

const projection = {
  type: 'dimetric-2:1' as const,
  originX: 0,
  originY: 0,
  tileWidth: 128 as const,
  tileHeight: 64 as const,
};

const keys = (up = false, down = false, left = false, right = false) => ({
  up,
  down,
  left,
  right,
});

describe('isometric keyboard input', () => {
  it.each([
    [keys(true), { u: -1 / 64, v: -1 / 64 }, { x: 0, y: -1 }],
    [keys(false, false, false, true), { u: 1 / 128, v: -1 / 128 }, { x: 1, y: 0 }],
    [keys(false, true), { u: 1 / 64, v: 1 / 64 }, { x: 0, y: 1 }],
    [keys(false, false, true), { u: -1 / 128, v: 1 / 128 }, { x: -1, y: 0 }],
  ])('maps screen-relative keys to logical vectors', (pressed, expected, screenExpected) => {
    expect(resolveIsoInput(pressed, false)).toEqual(expected);
    const vector = resolveIsoInput(pressed, false);
    expect((vector.u - vector.v) * 64).toBeCloseTo(screenExpected.x);
    expect((vector.u + vector.v) * 32).toBeCloseTo(screenExpected.y);
  });

  it.each([
    [keys(true, true), { u: 0, v: 0 }],
    [keys(false, false, true, true), { u: 0, v: 0 }],
    [keys(true, true, true, true), { u: 0, v: 0 }],
    [keys(true, false, false, true), { u: -1 / 128, v: -3 / 128 }],
  ])('cancels opposing axes and preserves diagonal screen intent', (pressed, expected) => {
    expect(resolveIsoInput(pressed, false)).toEqual(expected);
  });

  it('returns zero while a text field has focus', () => {
    expect(resolveIsoInput(keys(true, false, false, true), true)).toEqual({ u: 0, v: 0 });
  });

  it('keeps the rendered speed constant for cardinal and diagonal input', () => {
    const cardinal = screenSpeedVector(
      resolveIsoInput(keys(false, false, false, true), false),
      projection,
      120,
    );
    const diagonal = screenSpeedVector(
      resolveIsoInput(keys(true, false, false, true), false),
      projection,
      120,
    );
    const screenLength = (d: { u: number; v: number }) => {
      const { x, y } = {
        x: (d.u - d.v) * 64,
        y: (d.u + d.v) * 32,
      };
      return Math.hypot(x, y);
    };
    expect(screenLength(cardinal)).toBeCloseTo(120);
    expect(screenLength(diagonal)).toBeCloseTo(120);
  });
});
