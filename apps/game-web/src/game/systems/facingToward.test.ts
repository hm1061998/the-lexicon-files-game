import { describe, expect, it } from 'vitest';
import { facingToward } from './facingToward';

describe('facingToward', () => {
  it.each([
    [{ u: 0, v: 0 }, { u: 1, v: 0 }, 'SE'],
    [{ u: 0, v: 0 }, { u: 0, v: -1 }, 'NE'],
    [{ u: 0, v: 0 }, { u: 0, v: 1 }, 'SW'],
    [{ u: 0, v: 0 }, { u: -1, v: 0 }, 'NW'],
    [{ u: 0, v: 0 }, { u: 1, v: 1 }, 'SE'],
    [{ u: 2, v: 3 }, { u: 2, v: 3 }, 'SE'],
  ] as const)('faces from %o toward %o', (from, to, expected) => {
    expect(facingToward(from, to)).toBe(expected);
  });
});
