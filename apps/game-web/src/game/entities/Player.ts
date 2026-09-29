import Phaser from 'phaser';
import { PLAYER_BODY, PLAYER_ORIGIN, PLAYER_SPEED } from '../constants';
import { facingTextureKey, resolveTextureKey } from '../assetManifest';
import { computeDepth } from '../systems/depth';
import { nextFacing, type Facing } from '../systems/direction';

export type PlayerSprite = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

export const PLAYER_INITIAL_FACING: Facing = 'SE';

export function createPlayer(scene: Phaser.Scene, x: number, y: number): PlayerSprite {
  const texture = resolveTextureKey(
    scene,
    facingTextureKey('player', PLAYER_INITIAL_FACING),
    'ph_player',
  );
  const player = scene.physics.add.sprite(x, y, texture);
  player.setOrigin(PLAYER_ORIGIN[0], PLAYER_ORIGIN[1]);
  player.body.setSize(PLAYER_BODY.width, PLAYER_BODY.height, false);
  // Align the bottom edge of the body with the feet (sprite origin Y).
  player.body.setOffset(
    (player.width - PLAYER_BODY.width) / 2,
    player.height * PLAYER_ORIGIN[1] - PLAYER_BODY.height,
  );
  player.setCollideWorldBounds(true);
  player.setDepth(computeDepth(y));
  return player;
}

/**
 * Applies velocity and depth, and swaps the facing texture only when the facing changes.
 * Returns the facing to remember (unchanged while idle).
 */
export function movePlayer(
  player: PlayerSprite,
  direction: { x: number; y: number },
  facing: Facing,
): Facing {
  player.setVelocity(direction.x * PLAYER_SPEED, direction.y * PLAYER_SPEED);
  player.setDepth(computeDepth(player.y));
  const next = nextFacing(facing, direction.x, direction.y);
  if (next !== facing) {
    const key = facingTextureKey('player', next);
    // Frames share one canvas size, so the feet-aligned body stays valid after the swap.
    if (player.scene.textures.exists(key)) player.setTexture(key);
  }
  return next;
}
