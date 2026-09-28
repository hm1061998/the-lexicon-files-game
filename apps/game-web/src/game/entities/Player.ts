import Phaser from 'phaser';
import { PLAYER_BODY, PLAYER_ORIGIN, PLAYER_SPEED } from '../constants';
import { computeDepth } from '../systems/depth';

export type PlayerSprite = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

export function createPlayer(scene: Phaser.Scene, x: number, y: number): PlayerSprite {
  const player = scene.physics.add.sprite(x, y, 'ph_player');
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

export function movePlayer(player: PlayerSprite, direction: { x: number; y: number }): void {
  player.setVelocity(direction.x * PLAYER_SPEED, direction.y * PLAYER_SPEED);
  player.setDepth(computeDepth(player.y));
}
