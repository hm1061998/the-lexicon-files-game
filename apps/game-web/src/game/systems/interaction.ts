export type InteractableArea = {
  id: string;
  x: number;
  y: number;
  radius: number;
  prompt: string;
};

export type IsoInteractableArea = LogicalPoint & {
  id: string;
  radius: number;
  prompt: string;
};

export function findNearestInteractable(
  pos: { x: number; y: number },
  areas: readonly InteractableArea[],
): InteractableArea | null {
  let nearest: InteractableArea | null = null;
  let nearestDistance = Infinity;

  for (const area of areas) {
    const distance = Math.hypot(pos.x - area.x, pos.y - area.y);
    if (distance > area.radius) {
      continue;
    }

    if (
      nearest === null ||
      distance < nearestDistance ||
      (distance === nearestDistance && area.id.localeCompare(nearest.id) < 0)
    ) {
      nearest = area;
      nearestDistance = distance;
    }
  }

  return nearest;
}
import type { IsoProjection } from '@lexicon/shared-types';
import type { LogicalPoint } from './isometricProjection';
import { projectIso } from './isometricProjection';

/** Resolves logical interaction points after projection so radius stays in visible screen pixels. */
export function findNearestIsoInteractable(
  pos: LogicalPoint,
  areas: readonly IsoInteractableArea[],
  projection: IsoProjection,
): IsoInteractableArea | null {
  const screenPos = projectIso(pos, projection);
  let nearest: IsoInteractableArea | null = null;
  let nearestDistance = Infinity;
  for (const area of areas) {
    const screenArea = projectIso(area, projection);
    const distance = Math.hypot(screenPos.x - screenArea.x, screenPos.y - screenArea.y);
    if (distance > area.radius) continue;
    if (
      nearest === null ||
      distance < nearestDistance ||
      (distance === nearestDistance && area.id.localeCompare(nearest.id) < 0)
    ) {
      nearest = area;
      nearestDistance = distance;
    }
  }
  return nearest;
}
