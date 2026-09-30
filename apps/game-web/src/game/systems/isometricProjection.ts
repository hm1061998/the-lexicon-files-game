import type { IsoProjection } from '@lexicon/shared-types';

export interface LogicalPoint {
  readonly u: number;
  readonly v: number;
}

export interface ScreenPoint {
  readonly x: number;
  readonly y: number;
}

/** Projects a floor point to pixels; elevation moves only the rendered y coordinate. */
export function projectIso(
  point: LogicalPoint,
  projection: IsoProjection,
  elevationPx = 0,
): ScreenPoint {
  const halfWidth = projection.tileWidth / 2;
  const halfHeight = projection.tileHeight / 2;
  return {
    x: projection.originX + (point.u - point.v) * halfWidth,
    y: projection.originY + (point.u + point.v) * halfHeight - elevationPx,
  };
}

/** Converts rendered floor pixels back to continuous logical floor coordinates. */
export function unprojectIso(point: ScreenPoint, projection: IsoProjection): LogicalPoint {
  const dx = (point.x - projection.originX) / (projection.tileWidth / 2);
  const dy = (point.y - projection.originY) / (projection.tileHeight / 2);
  return { u: (dx + dy) / 2, v: (dy - dx) / 2 };
}
