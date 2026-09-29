import Phaser from 'phaser';
import type { CharacterSheet } from '@lexicon/shared-types';
import { PLAYER_BODY, PLAYER_ORIGIN, PLAYER_SPEED } from '../constants';
import { facingTextureKey, resolveTextureKey } from '../assetManifest';
import { computePlayerDepth } from '../systems/depth';
import { nextFacing, type Facing } from '../systems/direction';
import { isWalking } from '../systems/walkMotion';
import { planWalk, registerCharacterAnimations, walkAnimKey } from './characterAnimations';

export type PlayerSprite = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

export const PLAYER_INITIAL_FACING: Facing = 'SE';

/** Character name of the player in `CaseDefinition.characterSheets` and its anim keys. */
export const PLAYER_NAME = 'player';

export function createPlayer(
  scene: Phaser.Scene,
  x: number,
  y: number,
  sheet: CharacterSheet,
): PlayerSprite {
  const texture = resolveTextureKey(
    scene,
    facingTextureKey(sheet.idle, PLAYER_INITIAL_FACING),
    'ph_player',
  );
  // A walk sheet that failed to load leaves the player on its idle stills.
  if (sheet.walk && scene.textures.exists(sheet.walk)) {
    registerCharacterAnimations(scene, PLAYER_NAME, sheet.walk);
  }
  const player = scene.physics.add.sprite(x, y, texture);
  player.setOrigin(PLAYER_ORIGIN[0], PLAYER_ORIGIN[1]);
  player.body.setSize(PLAYER_BODY.width, PLAYER_BODY.height, false);
  // Align the bottom edge of the body with the feet (sprite origin Y).
  player.body.setOffset(
    (player.width - PLAYER_BODY.width) / 2,
    player.height * PLAYER_ORIGIN[1] - PLAYER_BODY.height,
  );
  player.setCollideWorldBounds(true);
  player.setDepth(computePlayerDepth(y));
  return player;
}

/** Walk animation currently playing on the player and its 0-based frame, or null. */
export function currentWalk(player: PlayerSprite): { key: string; frame: number } | null {
  const { anims } = player;
  if (!anims.isPlaying || !anims.currentAnim || !anims.currentFrame) return null;
  return { key: anims.currentAnim.key, frame: anims.currentFrame.index - 1 };
}

function displacement(player: PlayerSprite): {
  deltaX: number;
  deltaY: number;
  blocked: boolean;
} {
  const { body } = player;
  return { deltaX: body.deltaX(), deltaY: body.deltaY(), blocked: !body.blocked.none };
}

/**
 * Applies velocity and depth, plays the walk of the facing while moving and shows the idle
 * still of the last facing when stopped. Returns the facing to remember (unchanged while idle).
 * Walk and idle frames share one 160 px canvas, so the feet-aligned body stays valid.
 * The walk plays only while the body was actually displaced by the last physics step, so
 * pushing into a wall or decor shows the idle still of the facing instead of walking in place.
 */
export function movePlayer(
  player: PlayerSprite,
  direction: { x: number; y: number },
  facing: Facing,
  sheet: CharacterSheet,
): Facing {
  player.setVelocity(direction.x * PLAYER_SPEED, direction.y * PLAYER_SPEED);
  player.setDepth(computePlayerDepth(player.y));
  const next = nextFacing(facing, direction.x, direction.y);
  const plan = planWalk({
    name: PLAYER_NAME,
    moving: (direction.x !== 0 || direction.y !== 0) && isWalking(displacement(player)),
    hasWalk: sheet.walk !== null && player.scene.anims.exists(walkAnimKey(PLAYER_NAME, next)),
    facing: next,
    current: currentWalk(player),
  });
  if (plan.type === 'play') {
    player.anims.play({ key: plan.key, startFrame: plan.startFrame }, true);
  } else if (plan.type === 'idle') {
    if (player.anims.isPlaying) player.anims.stop();
    const key = facingTextureKey(sheet.idle, plan.facing);
    if (player.texture.key !== key && player.scene.textures.exists(key)) player.setTexture(key);
  }
  return next;
}
