/** What the marker float tween should do when the reduced-motion preference changes. */
export function markerMotion(previous: boolean, next: boolean): 'pause' | 'resume' | 'none' {
  if (previous === next) return 'none';
  return next ? 'pause' : 'resume';
}
