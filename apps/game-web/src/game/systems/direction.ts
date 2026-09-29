export type Facing = 'NE' | 'SE' | 'SW' | 'NW';

export function resolveDirection(vx: number, vy: number): Facing | null {
  if (vx === 0 && vy === 0) {
    return null;
  }

  if (vx >= 0 && vy < 0) return 'NE';
  if (vx >= 0 && vy >= 0) return 'SE';
  if (vx < 0 && vy >= 0) return 'SW';
  return 'NW';
}

/** Facing after a movement step: the resolved direction, or the last facing while idle. */
export function nextFacing(current: Facing, vx: number, vy: number): Facing {
  return resolveDirection(vx, vy) ?? current;
}
