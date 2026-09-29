export type Point = { x: number; y: number };
export type Size = { width: number; height: number };
export type Rect = { left: number; top: number; right: number; bottom: number };

export type CameraView = {
  scrollX: number;
  scrollY: number;
  zoom: number;
  /** Camera size in game pixels (before the CSS scale of the canvas). */
  width: number;
  height: number;
};

export const ANCHOR_EMIT_INTERVAL_MS = 50;
export const ANCHOR_MIN_DISTANCE = 2;
/** Horizontal gap between the target and the bubble. */
export const BUBBLE_GAP = 12;

/**
 * World point -> CSS pixels relative to the canvas element. The canvas is FIT-scaled, so the
 * game-pixel offset is multiplied by `canvasRect.width / camera.width`.
 */
export function worldToScreen(world: Point, camera: CameraView, canvasRect: Size): Point {
  const scaleX = camera.width > 0 ? canvasRect.width / camera.width : 1;
  const scaleY = camera.height > 0 ? canvasRect.height / camera.height : 1;
  return {
    x: (world.x - camera.scrollX) * camera.zoom * scaleX,
    y: (world.y - camera.scrollY) * camera.zoom * scaleY,
  };
}

/** Keeps a bubble of `size` inside the viewport with `margin` on every edge. */
export function clampBubble(pos: Point, size: Size, viewport: Size, margin: number): Point {
  const maxX = Math.max(margin, viewport.width - size.width - margin);
  const maxY = Math.max(margin, viewport.height - size.height - margin);
  return {
    x: Math.min(Math.max(pos.x, margin), maxX),
    y: Math.min(Math.max(pos.y, margin), maxY),
  };
}

function overlaps(pos: Point, size: Size, rect: Rect): boolean {
  return (
    pos.x < rect.right &&
    pos.x + size.width > rect.left &&
    pos.y < rect.bottom &&
    pos.y + size.height > rect.top
  );
}

/**
 * Bubble position beside the anchor: right side first, then the opposite (left) side, each level with,
 * above and below the anchor. Returns null when every candidate would cover a forbidden rectangle
 * (minimap, objective panel, key bar); the caller then falls back to the fixed prompt.
 */
export function placeBubble(
  anchor: Point,
  size: Size,
  viewport: Size,
  margin: number,
  avoid: readonly Rect[],
): Point | null {
  const xs = [anchor.x + BUBBLE_GAP, anchor.x - BUBBLE_GAP - size.width];
  const ys = [anchor.y - 4, anchor.y - size.height + 4, anchor.y + 28];
  for (const y of ys) {
    for (const x of xs) {
      const pos = clampBubble({ x, y }, size, viewport, margin);
      if (!avoid.some((rect) => overlaps(pos, size, rect))) return pos;
    }
  }
  return null;
}

/** Throttle for `interaction:anchor`: first anchor at once, then >= 50 ms apart and >= 2 px moved. */
export function shouldEmitAnchor(prev: Point | null, next: Point, dtMs: number): boolean {
  if (prev === null) return true;
  if (dtMs < ANCHOR_EMIT_INTERVAL_MS) return false;
  return Math.hypot(next.x - prev.x, next.y - prev.y) >= ANCHOR_MIN_DISTANCE;
}
