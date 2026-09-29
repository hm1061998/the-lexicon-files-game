import type Phaser from 'phaser';
import type { Facing } from '../systems/direction';

/** Walk sheet contract (docs/art/07 "Walk sheet"): 8 columns x 4 rows, 160 px cells, 10 fps. */
export const WALK_FRAMES = 8;
export const WALK_FPS = 10;
export const WALK_SHEET_ROWS: readonly Facing[] = ['NE', 'SE', 'SW', 'NW'];

/** Animation key `${actor}_${action}_${direction}` (apps/game-web/AGENTS.md). */
export function walkAnimKey(name: string, facing: Facing): string {
  return `${name}_walk_${facing.toLowerCase()}`;
}

/**
 * Registers one looping walk animation per sheet row. Animations live in the game-wide
 * animation manager, so a scene restart reuses them instead of recreating them.
 */
export function registerCharacterAnimations(
  scene: Phaser.Scene,
  name: string,
  sheetKey: string,
): void {
  WALK_SHEET_ROWS.forEach((facing, row) => {
    const key = walkAnimKey(name, facing);
    if (scene.anims.exists(key)) return;
    scene.anims.create({
      key,
      frames: scene.anims.generateFrameNumbers(sheetKey, {
        start: row * WALK_FRAMES,
        end: row * WALK_FRAMES + WALK_FRAMES - 1,
      }),
      frameRate: WALK_FPS,
      repeat: -1,
    });
  });
}

export type WalkInput = {
  name: string;
  moving: boolean;
  hasWalk: boolean;
  facing: Facing;
  /** Walk animation currently playing and its 0-based frame, or null. */
  current: { key: string; frame: number } | null;
};

export type WalkPlan =
  | { type: 'play'; key: string; startFrame: number }
  | { type: 'keep' }
  | { type: 'idle'; facing: Facing };

/**
 * What the player sprite should show this step. Changing direction mid-stride starts the new
 * direction on the current frame, so the legs do not snap back to the contact pose.
 */
export function planWalk({ name, moving, hasWalk, facing, current }: WalkInput): WalkPlan {
  if (!moving || !hasWalk) return { type: 'idle', facing };
  const key = walkAnimKey(name, facing);
  if (current?.key === key) return { type: 'keep' };
  return { type: 'play', key, startFrame: current?.frame ?? 0 };
}
