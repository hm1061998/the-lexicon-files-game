export type Facing = 'NE' | 'SE' | 'SW' | 'NW';

const DIRECTION_TIE_EPSILON = 1e-6;

export function resolveDirection(vx: number, vy: number): Facing | null {
  if (vx === 0 && vy === 0) {
    return null;
  }

  // A screen-cardinal vector sits between two diagonal sprite rows. Keep one
  // deterministic row inside a tiny tolerance to absorb projection rounding.
  if (Math.abs(vy) <= DIRECTION_TIE_EPSILON) return vx > 0 ? 'NE' : 'SW';
  if (Math.abs(vx) <= DIRECTION_TIE_EPSILON) return vy < 0 ? 'NW' : 'SE';
  if (vx > 0 && vy < 0) return 'NE';
  if (vx > 0 && vy > 0) return 'SE';
  if (vx < 0 && vy > 0) return 'SW';
  return 'NW';
}

/** Facing after a movement step: the resolved direction, or the last facing while idle. */
export function nextFacing(current: Facing, vx: number, vy: number): Facing {
  return resolveDirection(vx, vy) ?? current;
}
