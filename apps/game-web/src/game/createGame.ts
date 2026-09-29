import Phaser from 'phaser';
import { PALETTE } from './constants';
import { BootScene } from './scenes/BootScene';
import { WorldScene, type WorldOptions } from './scenes/WorldScene';

export type { InputLockSource, MotionSource } from './scenes/WorldScene';

export function createGame(parent: HTMLElement, options: WorldOptions): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 1920,
    height: 1080,
    backgroundColor: PALETTE.inkBlack,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    // panicMax 0: no 120-frame startup window where delta is clamped to 1/60 s
    // (made movement run in slow motion on low-fps devices right after boot).
    fps: { panicMax: 0 },
    // A stalled texture request errors out (warns, placeholder) instead of holding a scene
    // transition behind a black fade forever.
    loader: { timeout: 15000 },
    physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 } } },
    callbacks: {
      preBoot: (game) => {
        game.registry.set('world', options);
      },
    },
    scene: [BootScene, WorldScene],
  });
}
