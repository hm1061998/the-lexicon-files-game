import type { IsoProjection } from '@lexicon/shared-types';
import type { LogicalPoint } from './isometricProjection';
import type { MovementKeys } from './input';

/** WASD on the logical floor: W=-u/NW, D=-v/NE, S=+u/SE, A=+v/SW. */
export function resolveIsoInput(keys: MovementKeys, typing: boolean): LogicalPoint {
  if (typing) return { u: 0, v: 0 };
  return {
    u: Number(keys.down) - Number(keys.up),
    v: Number(keys.left) - Number(keys.right),
  };
}

/** Converts a logical direction into logical units/sec at a requested screen-space speed. */
export function screenSpeedVector(
  direction: LogicalPoint,
  projection: IsoProjection,
  speedPxPerSecond: number,
): LogicalPoint {
  const halfWidth = projection.tileWidth / 2;
  const halfHeight = projection.tileHeight / 2;
  const screenX = (direction.u - direction.v) * halfWidth;
  const screenY = (direction.u + direction.v) * halfHeight;
  const length = Math.hypot(screenX, screenY);
  if (length === 0 || speedPxPerSecond === 0) return { u: 0, v: 0 };

  const scaledX = (screenX / length) * speedPxPerSecond;
  const scaledY = (screenY / length) * speedPxPerSecond;
  const dx = scaledX / halfWidth;
  const dy = scaledY / halfHeight;
  return { u: (dx + dy) / 2, v: (dy - dx) / 2 };
}
