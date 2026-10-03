import { describe, expect, it } from 'vitest';
import { revealCount } from './revealCount';

describe('revealCount', () => {
  it('starts at zero and grows with time', () => {
    expect(revealCount(0, 45, 100)).toBe(0);
    expect(revealCount(1000, 45, 100)).toBe(45);
    expect(revealCount(500, 90, 100)).toBe(45);
  });

  it('never exceeds the text length', () => {
    expect(revealCount(60_000, 45, 100)).toBe(100);
  });

  it('shows everything at once for an infinite speed (instant)', () => {
    expect(revealCount(0, Infinity, 100)).toBe(100);
  });

  it('copes with an empty text and a negative elapsed time', () => {
    expect(revealCount(500, 45, 0)).toBe(0);
    expect(revealCount(-50, 45, 10)).toBe(0);
  });
});
