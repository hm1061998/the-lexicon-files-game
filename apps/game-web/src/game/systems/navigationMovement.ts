import type { NavigationController } from './navigationController';
import type { NavigationWorld } from './navigation';
import { projectIso, type LogicalPoint } from './isometricProjection';
import { screenSpeedVector } from './isoInput';
import { moveWithCollisions } from './logicalCollision';

/** Spend the complete frame across waypoints; each substep uses the same swept resolver. */
export function advanceNavigationMovement(
  route: NavigationController,
  start: LogicalPoint,
  world: NavigationWorld,
  deltaMs: number,
  speed: number,
): { position: LogicalPoint; direction: LogicalPoint } {
  let position = start,
    direction = { u: 0, v: 0 },
    remaining = Math.max(0, Math.min(50, deltaMs));
  for (let i = 0; i < 512 && remaining > 1e-6; i++) {
    const next = route.direction(position, remaining);
    if (!next) break;
    direction = next;
    const a = projectIso(position, world.projection);
    const b = projectIso({ u: position.u + next.u, v: position.v + next.v }, world.projection);
    const duration = Math.min(remaining, (Math.hypot(b.x - a.x, b.y - a.y) / speed) * 1000);
    if (duration <= 1e-6) break;
    const velocity = screenSpeedVector(next, world.projection, speed);
    const requested = { u: (velocity.u * duration) / 1000, v: (velocity.v * duration) / 1000 };
    const result = moveWithCollisions(position, requested, world.body, world.solids, world.bounds);
    const blocked =
      Math.abs(result.position.u - position.u - requested.u) > 1e-8 ||
      Math.abs(result.position.v - position.v - requested.v) > 1e-8;
    position = result.position;
    remaining -= duration;
    if (blocked) break;
  }
  route.observeMovement(start, position, deltaMs);
  route.direction(position, 0);
  return { position, direction };
}
