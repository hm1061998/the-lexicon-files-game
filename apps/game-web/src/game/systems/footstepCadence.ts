export const FOOTSTEP_STRIDE_PX = 42;
export type FootstepState = { distancePx: number };

export function advanceFootstep(
  state: FootstepState,
  actualDistancePx: number,
  locked: boolean,
): { state: FootstepState; emit: boolean } {
  if (locked) return { state: { distancePx: 0 }, emit: false };
  const total = state.distancePx + Math.max(0, actualDistancePx);
  if (total < FOOTSTEP_STRIDE_PX) return { state: { distancePx: total }, emit: false };
  return {
    state: { distancePx: actualDistancePx > FOOTSTEP_STRIDE_PX ? 0 : total % FOOTSTEP_STRIDE_PX },
    emit: true,
  };
}
