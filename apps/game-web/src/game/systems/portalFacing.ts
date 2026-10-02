import { findPortalWall } from '@lexicon/game-content';
import type { LogicalPoint, SceneDefinition } from '@lexicon/shared-types';

export type PortalFacing = 'ne' | 'nw' | 'ne-flip' | 'nw-flip';

/**
 * Which of the two arch drawings a wall needs. A wall running along v is the `ne` drawing and
 * one along u the `nw` drawing; walls past the middle of the room use the mirrored copy.
 */
export function portalFacing(
  wall: { axis: 'u' | 'v'; line: number },
  sceneSize: { u: number; v: number },
): PortalFacing {
  const base = wall.axis === 'v' ? 'ne' : 'nw';
  const extent = wall.axis === 'v' ? sceneSize.u : sceneSize.v;
  return wall.line > extent / 2 ? `${base}-flip` : base;
}

/** Facing for a portal asset, derived from the wall segment that holds its opening. */
export function facingForPortal(scene: SceneDefinition, position: LogicalPoint): PortalFacing {
  const wall = scene.walls ? findPortalWall(scene.walls, position) : undefined;
  if (!wall || !('u' in scene.worldBounds)) return 'ne';
  return portalFacing(wall, {
    u: scene.worldBounds.u + scene.worldBounds.width,
    v: scene.worldBounds.v + scene.worldBounds.height,
  });
}
