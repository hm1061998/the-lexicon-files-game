export type WalkMotion = {
  /** Displacement of the body over the last physics step, in px. */
  deltaX: number;
  deltaY: number;
  /** True when the body is touching an obstacle or the world edge. */
  blocked: boolean;
};

/**
 * Whether the character is really walking: the walk animation must follow actual displacement,
 * not key state, so pushing into a wall shows the idle still. While blocked, collision
 * separation jitters the body by a fraction of a pixel, so the threshold doubles; sliding along
 * an obstacle still moves a whole step per frame and keeps walking.
 */
export function isWalking({ deltaX, deltaY, blocked }: WalkMotion, epsilon = 0.5): boolean {
  return Math.hypot(deltaX, deltaY) > (blocked ? epsilon * 2 : epsilon);
}
