import Phaser from 'phaser';
import { PALETTE } from '../constants';
import { generatePlaceholderTextures } from '../textures';
import { WorldScene } from './WorldScene';

export class BootScene extends Phaser.Scene {
  static readonly KEY = 'Boot';

  constructor() {
    super(BootScene.KEY);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(PALETTE.inkBlack);
    generatePlaceholderTextures(this);
    this.scene.start(WorldScene.KEY);
  }
}
