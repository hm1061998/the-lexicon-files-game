export const PLAYER_MOVED_INTERVAL_MS = 100;
export const PLAYER_MOVED_MIN_DISTANCE = 2;

type Point = { x: number; y: number };

/**
 * Throttle for the published `player:moved` position: the first position always goes out;
 * afterwards at most every 100 ms and only when the player shifted at least 2 px.
 */
export function shouldEmitPlayerMoved(prev: Point | null, next: Point, dtMs: number): boolean {
  if (prev === null) return true;
  if (dtMs < PLAYER_MOVED_INTERVAL_MS) return false;
  return Math.hypot(next.x - prev.x, next.y - prev.y) >= PLAYER_MOVED_MIN_DISTANCE;
}
