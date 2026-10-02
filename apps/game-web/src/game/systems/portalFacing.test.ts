import { describe, expect, it } from 'vitest';
import { portalFacing } from './portalFacing';

const size = { u: 16, v: 12 };

describe('portalFacing', () => {
  it('uses the ne art for a wall running along v', () => {
    expect(portalFacing({ axis: 'v', line: 0 }, size)).toBe('ne');
  });

  it('uses the nw art for a wall running along u', () => {
    expect(portalFacing({ axis: 'u', line: 0 }, size)).toBe('nw');
  });

  it('flips the art for a wall past the middle of the room', () => {
    expect(portalFacing({ axis: 'v', line: 15.75 }, size)).toBe('ne-flip');
    expect(portalFacing({ axis: 'u', line: 11.75 }, size)).toBe('nw-flip');
  });

  it('keeps the plain art exactly at the middle', () => {
    expect(portalFacing({ axis: 'v', line: 8 }, size)).toBe('ne');
    expect(portalFacing({ axis: 'u', line: 6 }, size)).toBe('nw');
  });
});
