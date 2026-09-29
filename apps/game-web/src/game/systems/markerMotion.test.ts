import { describe, expect, it } from 'vitest';
import { markerMotion } from './markerMotion';

describe('markerMotion', () => {
  it.each([
    [false, false, 'none'],
    [false, true, 'pause'],
    [true, false, 'resume'],
    [true, true, 'none'],
  ] as const)('%s -> %s = %s', (previous, next, expected) => {
    expect(markerMotion(previous, next)).toBe(expected);
  });
});
