import type { LogicalPoint } from './isometricProjection';
import { resolveDirection } from './direction';

/** Choose the eight-way sprite facing from one actor's floor point toward another. */
export function facingToward(from: LogicalPoint, to: LogicalPoint) {
  const screenX = (to.u - from.u) - (to.v - from.v);
  const screenY = (to.u - from.u) + (to.v - from.v);
  return resolveDirection(screenX, screenY) ?? 'SE';
}
