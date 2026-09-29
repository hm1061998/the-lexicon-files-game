/** Marker Y = anchored base position plus the current float-tween offset. */
export function markerPositionY(baseY: number, floatOffset: number): number {
  return baseY + floatOffset;
}

/** Default lift of the marker above an interaction point. */
export const MARKER_OFFSET_Y = -90;
/** Minimum gap between the marker centre and the top of the interactable's visible art. */
export const MARKER_TOP_GAP = 20;

/** Marker anchor: the default lift, raised further when the art reaches above it. */
export function markerBaseY(areaY: number, visualTopY: number): number {
  return Math.min(areaY + MARKER_OFFSET_Y, visualTopY - MARKER_TOP_GAP);
}
