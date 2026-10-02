import type { LogicalPoint, SceneDefinition, WallSegmentDefinition } from '@lexicon/shared-types';

/** How far (in tiles) a portal may sit from its wall line, across the wall. */
export const PORTAL_LINE_TOLERANCE = 0.25;
const EPS = 1e-9;

/** The wall segment whose opening contains `position`, or undefined when there is none. */
export function findPortalWall(
  walls: readonly WallSegmentDefinition[],
  position: LogicalPoint,
): WallSegmentDefinition | undefined {
  return walls.find((wall) => {
    const across = wall.axis === 'v' ? position.u : position.v;
    const along = wall.axis === 'v' ? position.v : position.u;
    if (Math.abs(across - wall.line) > PORTAL_LINE_TOLERANCE + EPS) return false;
    return wall.openings.some(
      (opening) => along >= opening.start - EPS && along <= opening.end + EPS,
    );
  });
}

/** Every asset with a `portal` must stand inside a wall opening, on the wall. */
export function validatePortalPlacement(scene: SceneDefinition): string[] {
  const walls = scene.walls ?? [];
  const errors: string[] = [];
  for (const asset of scene.assets) {
    if (!asset.portal) continue;
    const position = asset.position;
    if (!position || !findPortalWall(walls, position))
      errors.push(`scenes.${scene.id}.${asset.id}.portal: not inside any wall opening`);
  }
  return errors;
}
