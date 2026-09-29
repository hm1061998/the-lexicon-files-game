import Phaser from 'phaser';
import { loadTextureManifest } from '../assetManifest';
import { PALETTE } from '../constants';
import { generatePlaceholderTextures } from '../textures';
import { generatePaperOverlayTexture } from '../paperOverlay';
import { WorldScene } from './WorldScene';

export class BootScene extends Phaser.Scene {
  static readonly KEY = 'Boot';

  constructor() {
    super(BootScene.KEY);
  }

  preload(): void {
    // A missing or broken file must not blank the game: warn and let placeholders stand in.
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      console.warn('[Assets] failed to load', file.key);
    });
    loadTextureManifest(this);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(PALETTE.inkBlack);
    generatePlaceholderTextures(this);
    generatePaperOverlayTexture(this);
    this.scene.start(WorldScene.KEY);
  }
}
