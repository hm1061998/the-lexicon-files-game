export type InteractableArea = {
  id: string;
  x: number;
  y: number;
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
