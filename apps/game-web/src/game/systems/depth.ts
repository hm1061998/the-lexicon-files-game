import type { IsoProjection } from '@lexicon/shared-types';
import type { LogicalPoint } from './isometricProjection';
import { projectIso } from './isometricProjection';

export function computeDepth(feetY: number, depthBias = 0): number {
  return feetY + depthBias;
}

/**
 * Tie-breaker added to the player's depth. Props sort by their feet line, so a player standing
 * exactly on a prop's feet line (e.g. at the terminal's interaction point) must draw above it,
 * not flicker on insertion order. Well below 1 px, so ordering by feet is otherwise unchanged.
 */
export const PLAYER_DEPTH_EPSILON = 0.01;

/** Depth follows the projected floor contact; visual elevation is deliberately excluded. */
export function computeIsoDepth(
  floorAnchor: LogicalPoint,
  projection: IsoProjection,
  depthBias = 0,
): number {
  return projectIso(floorAnchor, projection).y + depthBias;
}

export function computePlayerDepth(feetY: number): number {
  return computeDepth(feetY, PLAYER_DEPTH_EPSILON);
}


