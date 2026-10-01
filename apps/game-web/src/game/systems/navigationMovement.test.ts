import { expect, it } from 'vitest';
import { advanceNavigationMovement } from './navigationMovement';
import { createNavigationController } from './navigationController';
import { findNavigationPath, navigationSegmentClear, type NavigationWorld } from './navigation';
import { projectIso } from './isometricProjection';
const world: NavigationWorld = {
  bounds: { u: 0, v: 0, width: 8, height: 8 },
  body: { u: -0.18, v: -0.18, width: 0.36, height: 0.36 },
  solids: [],
  projection: { type: 'dimetric-2:1', originX: 0, originY: 0, tileWidth: 128, tileHeight: 64 },
};
it('consumes the whole frame across waypoints at 30, 60 and 120 FPS', () => {
  for (const fps of [30, 60, 120]) {
    const route = createNavigationController();
    const points = Array.from({ length: 48 }, (_, i) => ({ u: 1 + (i + 1) / 8, v: 4 }));
    route.replace(points);
    let position = { u: 1, v: 4 },
      elapsed = 0;
    while (route.isActive() && elapsed < 5000) {
      position = advanceNavigationMovement(route, position, world, 1000 / fps, 220).position;
      elapsed += 1000 / fps;
    }
    const a = projectIso({ u: 1, v: 4 }, world.projection),
      b = projectIso({ u: 7, v: 4 }, world.projection);
    const expected = (Math.hypot(b.x - a.x, b.y - a.y) / 220) * 1000;
    expect(Math.abs(elapsed - expected)).toBeLessThanOrEqual(1000 / fps + 10);
    expect(position.u).toBeCloseTo(7, 1);
  }
});
it('checks collision for every segment when one frame crosses a corner', () => {
  const fixture = { ...world, solids: [{ u: 3, v: 1, width: 2, height: 5 }] };
  const path = findNavigationPath(
    { u: 1, v: 3 },
    { kind: 'point', point: { u: 7, v: 3 } },
    fixture,
  );
  expect(path.status).toBe('found');
  if (path.status !== 'found') return;
  const route = createNavigationController();
  route.replace(path.points);
  let position = { u: 1, v: 3 };
  for (let i = 0; i < 1000 && route.isActive(); i++) {
    const next = advanceNavigationMovement(route, position, fixture, 50, 220).position;
    expect(navigationSegmentClear(next, next, fixture)).toBe(true);
    position = next;
  }
  expect(route.isActive()).toBe(false);
  expect(position.u).toBeCloseTo(7, 1);
});
