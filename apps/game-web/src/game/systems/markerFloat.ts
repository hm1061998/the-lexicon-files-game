import { CHARACTER_FIGURE_HEIGHT } from '../constants';

/** Marker Y = anchored base position plus the current float-tween offset. */
export function markerPositionY(baseY: number, floatOffset: number): number {
  return baseY + floatOffset;
}

/** Default lift of the marker above an interaction point. */
export const MARKER_OFFSET_Y = -90;
/** Minimum gap between the marker centre and the top of the interactable's visible art. */
export const MARKER_TOP_GAP = 20;

/** Gap between the marker centre and the head of a player standing at the footprint edge. */
export const MARKER_HEAD_GAP = 10;

/**
 * Marker anchor: the default lift, raised further when the art reaches above it and, when the
 * interactable blocks movement (`blockedTopY` = top of its footprint, the highest feet Y a
 * player can have while standing behind it), high enough to clear that player's head.
 */
export function markerBaseY(areaY: number, visualTopY: number, blockedTopY?: number): number {
  const limits = [areaY + MARKER_OFFSET_Y, visualTopY - MARKER_TOP_GAP];
  if (blockedTopY !== undefined)
    limits.push(blockedTopY - CHARACTER_FIGURE_HEIGHT - MARKER_HEAD_GAP);
  return Math.min(...limits);
}
