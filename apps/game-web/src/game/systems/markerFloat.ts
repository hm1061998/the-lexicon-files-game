/** Marker Y = anchored base position plus the current float-tween offset. */
export function markerPositionY(baseY: number, floatOffset: number): number {
  return baseY + floatOffset;
}
