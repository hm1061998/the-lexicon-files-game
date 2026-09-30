import type { SceneAssetDefinition } from '@lexicon/shared-types';

/** Opacity of an occluding wall while the player stands behind it (docs/art/06 §29). */
export const OCCLUDED_ALPHA = 0.45;

export type Box = { x: number; y: number; width: number; height: number };

/**
 * Tall things the player can walk behind: inner room walls (`wall` assets narrower than the
 * world; the back wall spans it and nothing stands behind it) and wall-hung boards (props
 * without a footprint). Furniture, evidence and characters never fade.
 */
export function isOccluder(asset: SceneAssetDefinition, worldWidth: number): boolean {
  if (asset.type === 'wall') return (asset.wallSpan ?? asset.collision?.width ?? 0) < worldWidth;
  return asset.type === 'prop' && asset.collision === undefined;
}

function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

/** Alpha for an occluder drawn at `occluderFeetY`: faded only when it hides the player. */
export function occluderAlpha(
  occluder: Box,
  occluderFeetY: number,
  playerFigure: Box,
  playerFeetY: number,
): number {
  return playerFeetY < occluderFeetY && overlaps(occluder, playerFigure) ? OCCLUDED_ALPHA : 1;
}
