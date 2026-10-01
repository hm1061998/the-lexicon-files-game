import type { IsoProjection } from '@lexicon/shared-types';
import { unprojectIso, type LogicalPoint, type ScreenPoint } from './isometricProjection';
export type PointerTarget = {
  interactableId: string;
  visualBounds: { x: number; y: number; width: number; height: number };
  depth: number;
  anchor: LogicalPoint;
  radiusPx: number;
};
export type PointerOccluder = {
  bounds: PointerTarget['visualBounds'];
  depth: number;
  opaque: boolean;
  opaqueAt?: (point: ScreenPoint) => boolean;
};
const contains = (p: ScreenPoint, b: PointerTarget['visualBounds']) =>
  p.x >= b.x && p.x <= b.x + b.width && p.y >= b.y && p.y <= b.y + b.height;
export function isPointOccluded(point: ScreenPoint, occluder: PointerOccluder): boolean {
  return (
    occluder.opaque && contains(point, occluder.bounds) && (occluder.opaqueAt?.(point) ?? true)
  );
}
export function pickWorldTarget(
  point: ScreenPoint,
  targets: readonly PointerTarget[],
  occluders: readonly PointerOccluder[],
): PointerTarget | null {
  return (
    [...targets]
      .filter(
        (t) =>
          contains(point, t.visualBounds) &&
          !occluders.some((o) => o.depth > t.depth && isPointOccluded(point, o)),
      )
      .sort((a, b) => b.depth - a.depth || a.interactableId.localeCompare(b.interactableId))[0] ??
    null
  );
}
export function pointerToLogical(worldPoint: ScreenPoint, projection: IsoProjection): LogicalPoint {
  return unprojectIso(worldPoint, projection);
}
