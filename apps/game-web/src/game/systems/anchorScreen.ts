import type { IsoProjection } from '@lexicon/shared-types';
import type { LogicalPoint } from './isometricProjection';
import { projectIso } from './isometricProjection';

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
  // Phaser zooms about the camera centre: worldView.x = scrollX + width * (1 - 1 / zoom) / 2.
  const z = camera.zoom;
  return {
    x: ((world.x - camera.scrollX) * z - (camera.width * (z - 1)) / 2) * scaleX,
    y: ((world.y - camera.scrollY) * z - (camera.height * (z - 1)) / 2) * scaleY,
  };
}

/** Projects one logical interaction anchor to canvas CSS pixels, applying camera and CSS scales once. */
export function projectInteractionAnchor(
  logicalAnchor: LogicalPoint,
  projection: IsoProjection,
  camera: CameraView,
  canvasRect: Size,
): Point {
  return worldToScreen(projectIso(logicalAnchor, projection), camera, canvasRect);
}

/** Below this HUD width the bubble falls back to the fixed bottom-centre prompt. */
export const MIN_ANCHORED_WIDTH = 720;

export function canAnchorBubble(hudWidth: number, hudHeight: number): boolean {
  return hudWidth >= 960 && hudHeight >= 640;
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
  const ys = [
    anchor.y - 4,
    anchor.y - size.height + 4,
    anchor.y + 28,
    anchor.y - size.height - BUBBLE_GAP,
  ];
  for (const y of ys) {
    for (const x of xs) {
      const pos = clampBubble({ x, y }, size, viewport, margin);
      if (!avoid.some((rect) => overlaps(pos, size, rect))) return pos;
    }
  }
  return null;
}

export type IdAnchor = Point & { id: string; avoidRects?: readonly Rect[] };

function avoidRectsMoved(previous: IdAnchor, next: IdAnchor): boolean {
  const a = previous.avoidRects ?? [];
  const b = next.avoidRects ?? [];
  if (a.length !== b.length) return true;
  return a.some((rect, index) => {
    const other = b[index]!;
    return (
      Math.abs(rect.left - other.left) >= ANCHOR_MIN_DISTANCE ||
      Math.abs(rect.top - other.top) >= ANCHOR_MIN_DISTANCE ||
      Math.abs(rect.right - other.right) >= ANCHOR_MIN_DISTANCE ||
      Math.abs(rect.bottom - other.bottom) >= ANCHOR_MIN_DISTANCE
    );
  });
}

/**
 * Throttle for `interaction:anchor`: the first anchor and any change of target go out at once;
 * afterwards >= 50 ms apart and only when moved >= 2 px.
 */
export function shouldEmitAnchor(prev: IdAnchor | null, next: IdAnchor, dtMs: number): boolean {
  if (prev === null || prev.id !== next.id) return true;
  if (dtMs < ANCHOR_EMIT_INTERVAL_MS) return false;
  return (
    Math.hypot(next.x - prev.x, next.y - prev.y) >= ANCHOR_MIN_DISTANCE ||
    avoidRectsMoved(prev, next)
  );
}
