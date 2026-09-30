import { describe, expect, it } from 'vitest';
import { projectIso, unprojectIso } from './isometricProjection';

const projection = {
  type: 'dimetric-2:1' as const,
  originX: 200,
  originY: 100,
  tileWidth: 128 as const,
  tileHeight: 64 as const,
};

describe('dimetric 2:1 projection', () => {
  it('projects logical axes to southeast and northeast screen vectors', () => {
    expect(projectIso({ u: 1, v: 0 }, projection)).toEqual({ x: 264, y: 132 });
    expect(projectIso({ u: 0, v: 1 }, projection)).toEqual({ x: 136, y: 132 });
    expect(projectIso({ u: -1, v: 0 }, projection)).toEqual({ x: 136, y: 68 });
    expect(projectIso({ u: 0, v: -1 }, projection)).toEqual({ x: 264, y: 68 });
  });

  it('raises only the rendered screen y by elevation', () => {
    expect(projectIso({ u: 2, v: 3 }, projection, 10)).toEqual({ x: 136, y: 250 });
  });

  it('round trips fractional logical coordinates within 0.01 units', () => {
    const logical = { u: 2.375, v: -4.125 };
    const restored = unprojectIso(projectIso(logical, projection), projection);
    expect(Math.abs(restored.u - logical.u)).toBeLessThan(0.01);
    expect(Math.abs(restored.v - logical.v)).toBeLessThan(0.01);
  });
});
