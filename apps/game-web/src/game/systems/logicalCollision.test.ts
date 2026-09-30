import { describe, expect, it } from 'vitest';
import { moveWithCollisions } from './logicalCollision';

const bounds = { u: 0, v: 0, width: 10, height: 10 };
const body = { u: -0.25, v: -0.25, width: 0.5, height: 0.5 };

describe('logical-plane collision', () => {
  it('blocks the U axis at a wall while allowing movement along V', () => {
    const result = moveWithCollisions(
      { u: 1, v: 1 },
      { u: 3, v: 2 },
      body,
      [{ u: 2, v: 0, width: 0.5, height: 10 }],
      bounds,
    );
    expect(result.position.u).toBeCloseTo(1.75);
    expect(result.position.v).toBeCloseTo(3);
    expect(result.blockedU).toBe(true);
    expect(result.blockedV).toBe(false);
  });

  it('slides along the corner edge without passing through the solid', () => {
    const result = moveWithCollisions(
      { u: 1, v: 1 },
      { u: 2, v: 2 },
      body,
      [{ u: 2, v: 2, width: 1, height: 1 }],
      bounds,
    );
    expect(result.position.u).toBeCloseTo(3);
    expect(result.position.v).toBeCloseTo(1.75);
    expect(result.blockedU).toBe(false);
    expect(result.blockedV).toBe(true);
  });

  it('keeps the complete footprint inside world bounds', () => {
    const result = moveWithCollisions({ u: 1, v: 1 }, { u: -5, v: -5 }, body, [], bounds);
    expect(result.position).toEqual({ u: 0.25, v: 0.25 });
    expect(result.blockedU).toBe(true);
    expect(result.blockedV).toBe(true);
  });

  it('allows the footprint through a gap wider than the footprint', () => {
    const gapWall = [
      { u: 5, v: 0, width: 0.5, height: 4 },
      { u: 5, v: 6, width: 0.5, height: 4 },
    ];
    const result = moveWithCollisions({ u: 2, v: 5 }, { u: 5, v: 0 }, body, gapWall, bounds);
    expect(result.position.u).toBe(7);
    expect(result.blockedU).toBe(false);
  });
});
