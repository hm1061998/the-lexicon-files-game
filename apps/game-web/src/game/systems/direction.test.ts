import { describe, expect, it } from 'vitest';
import { nextFacing, resolveDirection } from './direction';

describe('resolveDirection', () => {
  it('returns NE for (1,-1)', () => {
    expect(resolveDirection(1, -1)).toBe('NE');
  });

  it('returns SE for (1,1)', () => {
    expect(resolveDirection(1, 1)).toBe('SE');
  });

  it('returns SW for (-1,1)', () => {
    expect(resolveDirection(-1, 1)).toBe('SW');
  });

  it('returns NW for (-1,-1)', () => {
    expect(resolveDirection(-1, -1)).toBe('NW');
  });

  it('returns null for (0,0)', () => {
    expect(resolveDirection(0, 0)).toBeNull();
  });
});

describe('nextFacing', () => {
  it('keeps the last facing while idle', () => {
    expect(nextFacing('NW', 0, 0)).toBe('NW');
  });

  it('switches to the resolved direction while moving', () => {
    expect(nextFacing('SE', -1, -1)).toBe('NW');
    expect(nextFacing('NW', 1, 0)).toBe('SE');
  });
});
