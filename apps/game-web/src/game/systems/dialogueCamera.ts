export type Point = { x: number; y: number };
export type Size = { width: number; height: number };
export type Rect = Size & Point;

/** The camera pushes in to this multiple of its normal zoom while a conversation is open. */
export const DIALOGUE_ZOOM_FACTOR = 1.2;

/**
 * Where the camera centre goes during a conversation: halfway between the player and the NPC,
 * kept so that the view at `zoom` (a `view` px camera shows `view / zoom` of the world) stays
 * inside `bounds`. A world smaller than the zoomed view is simply centred.
 */
export function dialogueCameraTarget(args: {
  player: Point;
  npc: Point;
  view: Size;
  bounds: Rect;
  zoom: number;
}): Point {
  const { player, npc, view, bounds, zoom } = args;
  const axis = (mid: number, start: number, length: number, viewLength: number): number => {
    const half = viewLength / zoom / 2;
    if (length <= half * 2) return start + length / 2;
    return Math.min(start + length - half, Math.max(start + half, mid));
  };
  return {
    x: axis((player.x + npc.x) / 2, bounds.x, bounds.width, view.width),
    y: axis((player.y + npc.y) / 2, bounds.y, bounds.height, view.height),
  };
}
