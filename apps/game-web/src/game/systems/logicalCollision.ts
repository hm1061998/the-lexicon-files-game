import type { LogicalPoint } from './isometricProjection';

export interface LogicalRect {
  readonly u: number;
  readonly v: number;
  readonly width: number;
  readonly height: number;
}

export interface CollisionMoveResult {
  readonly position: LogicalPoint;
  readonly blockedU: boolean;
  readonly blockedV: boolean;
}

const overlaps = (startA: number, sizeA: number, startB: number, sizeB: number) =>
  startA < startB + sizeB && startA + sizeA > startB;

function clampAxis(
  position: number,
  otherPosition: number,
  delta: number,
  body: LogicalRect,
  solids: readonly LogicalRect[],
  bounds: LogicalRect,
  axis: 'u' | 'v',
): { value: number; blocked: boolean } {
  if (delta === 0) return { value: position, blocked: false };
  const offset = axis === 'u' ? body.u : body.v;
  const size = axis === 'u' ? body.width : body.height;
  const otherOffset = axis === 'u' ? body.v : body.u;
  const otherSize = axis === 'u' ? body.height : body.width;
  const boundStart = axis === 'u' ? bounds.u : bounds.v;
  const boundSize = axis === 'u' ? bounds.width : bounds.height;
  const minPosition = boundStart - offset;
  const maxPosition = boundStart + boundSize - offset - size;
  const requested = position + delta;
  let resolved = Math.min(maxPosition, Math.max(minPosition, requested));

  for (const solid of solids) {
    const solidStart = axis === 'u' ? solid.u : solid.v;
    const solidSize = axis === 'u' ? solid.width : solid.height;
    const solidOtherStart = (axis === 'u' ? solid.v : solid.u);
    const solidOtherSize = axis === 'u' ? solid.height : solid.width;
    const otherStart = otherPosition + otherOffset;
    if (!overlaps(otherStart, otherSize, solidOtherStart, solidOtherSize)) continue;

    const currentStart = position + offset;
    const targetStart = resolved + offset;
    const currentEnd = currentStart + size;
    const targetEnd = targetStart + size;
    if (delta > 0 && currentEnd <= solidStart && targetEnd > solidStart) {
      resolved = Math.min(resolved, solidStart - offset - size);
    } else if (delta < 0 && currentStart >= solidStart + solidSize && targetStart < solidStart + solidSize) {
      resolved = Math.max(resolved, solidStart + solidSize - offset);
    }
  }

  return { value: resolved, blocked: Math.abs(resolved - requested) > 1e-9 };
}

/** Moves an axis-aligned logical footprint with swept per-axis collision and corner sliding. */
export function moveWithCollisions(
  position: LogicalPoint,
  delta: LogicalPoint,
  body: LogicalRect,
  solids: readonly LogicalRect[],
  bounds: LogicalRect,
): CollisionMoveResult {
  const u = clampAxis(position.u, position.v, delta.u, body, solids, bounds, 'u');
  const v = clampAxis(position.v, u.value, delta.v, body, solids, bounds, 'v');
  return { position: { u: u.value, v: v.value }, blockedU: u.blocked, blockedV: v.blocked };
}
