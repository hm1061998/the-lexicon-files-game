import { describe, expect, it } from 'vitest';
import { PLAYER_DEPTH_EPSILON, computeDepth, computePlayerDepth } from './depth';
import { computeIsoDepth } from './depth';

const projection = {
  type: 'dimetric-2:1' as const,
  originX: 0,
  originY: 100,
  tileWidth: 128 as const,
  tileHeight: 64 as const,
};

describe('computeDepth', () => {
  it('returns feetY when no bias is given', () => {
    expect(computeDepth(800)).toBe(800);
  });

  it('adds depthBias to feetY', () => {
    expect(computeDepth(800, 25)).toBe(825);
  });
});

describe('computePlayerDepth', () => {
  it('draws the player above a prop whose feet are on the same line', () => {
    expect(computePlayerDepth(1000)).toBeGreaterThan(computeDepth(1000));
  });

  it('keeps the epsilon far below one pixel so ordering by feet is unchanged', () => {
    expect(PLAYER_DEPTH_EPSILON).toBeGreaterThan(0);
    expect(PLAYER_DEPTH_EPSILON).toBeLessThan(1);
    expect(computePlayerDepth(999)).toBeLessThan(computeDepth(1000));
    expect(computePlayerDepth(1001)).toBeGreaterThan(computeDepth(1000));
  });
});

describe('computeIsoDepth', () => {
  it('sorts from the projected floor anchor and ignores visual elevation', () => {
    expect(computeIsoDepth({ u: 2, v: 3 }, projection, 4)).toBe(264);
    expect(computeIsoDepth({ u: 2, v: 3 }, projection, 5)).toBe(265);
  });
});
