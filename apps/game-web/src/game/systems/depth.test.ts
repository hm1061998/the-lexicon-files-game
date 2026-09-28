import { describe, expect, it } from 'vitest';
import { computeDepth } from './depth';

describe('computeDepth', () => {
  it('returns feetY when no bias is given', () => {
    expect(computeDepth(800)).toBe(800);
  });

  it('adds depthBias to feetY', () => {
    expect(computeDepth(800, 25)).toBe(825);
  });
});
