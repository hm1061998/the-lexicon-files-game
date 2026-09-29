import { describe, expect, it } from 'vitest';
import { markerPositionY } from './markerFloat';

describe('markerPositionY', () => {
  it.each([
    [100, 0, 100],
    [100, -4, 96],
    [-50, -4, -54],
  ])('base %d + offset %d = %d', (base, offset, expected) => {
    expect(markerPositionY(base, offset)).toBe(expected);
  });
});
