export type HudInsets = { top: number; right: number; bottom: number; left: number };
export type HudRect = { left: number; top: number; right: number; bottom: number };

export const ZERO_INSETS: HudInsets = { top: 0, right: 0, bottom: 0, left: 0 };

/** A block counts as touching an edge when it starts within this many px of it. */
const EDGE_TOUCH_PX = 32;

export function sameInsets(a: HudInsets, b: HudInsets): boolean {
  return a.top === b.top && a.right === b.right && a.bottom === b.bottom && a.left === b.left;
}

/**
 * How far HUD blocks reach into the screen from each edge, so world cues can keep clear of them.
 * Each block is assigned to its nearest edge (top, bottom, left, right on ties); blocks farther
 * than 32px from every edge float in the middle of the screen and are ignored.
 */
export function computeHudInsets(
  viewport: { width: number; height: number },
  rects: readonly HudRect[],
  /** Where the measured area starts in the same space as `rects` (the canvas when letterboxed). */
  origin: { x: number; y: number } = { x: 0, y: 0 },
): HudInsets {
  const insets: HudInsets = { top: 0, right: 0, bottom: 0, left: 0 };
  for (const placed of rects) {
    const rect = {
      left: placed.left - origin.x,
      right: placed.right - origin.x,
      top: placed.top - origin.y,
      bottom: placed.bottom - origin.y,
    };
    // A block that lies wholly over the letterbox bars never touches the canvas.
    if (
      rect.right <= 0 ||
      rect.left >= viewport.width ||
      rect.bottom <= 0 ||
      rect.top >= viewport.height
    )
      continue;
    const distances = [
      ['top', rect.top],
      ['bottom', viewport.height - rect.bottom],
      ['left', rect.left],
      ['right', viewport.width - rect.right],
    ] as const;
    let nearest: (typeof distances)[number] = distances[0];
    for (const entry of distances) if (entry[1] < nearest[1]) nearest = entry;
    if (nearest[1] > EDGE_TOUCH_PX) continue;
    switch (nearest[0]) {
      case 'top':
        insets.top = Math.max(insets.top, rect.bottom);
        break;
      case 'bottom':
        insets.bottom = Math.max(insets.bottom, viewport.height - rect.top);
        break;
      case 'left':
        insets.left = Math.max(insets.left, rect.right);
        break;
      case 'right':
        insets.right = Math.max(insets.right, viewport.width - rect.left);
        break;
    }
  }
  return insets;
}
