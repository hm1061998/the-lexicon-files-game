import { describe, expect, it } from 'vitest';
import { shouldEmitPlayerMoved } from './playerMoved';

describe('shouldEmitPlayerMoved', () => {
  const prev = { x: 100, y: 100 };

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
