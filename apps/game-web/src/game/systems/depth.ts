export function computeDepth(feetY: number, depthBias = 0): number {
  return feetY + depthBias;
}

/**
 * Tie-breaker added to the player's depth. Props sort by their feet line, so a player standing
 * exactly on a prop's feet line (e.g. at the terminal's interaction point) must draw above it,
 * not flicker on insertion order. Well below 1 px, so ordering by feet is otherwise unchanged.
 */
export const PLAYER_DEPTH_EPSILON = 0.01;

export function computePlayerDepth(feetY: number): number {
  return computeDepth(feetY, PLAYER_DEPTH_EPSILON);
}
