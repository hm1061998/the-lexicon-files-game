import { describe, expect, it } from 'vitest';
import { resolveDirection } from './direction';

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
