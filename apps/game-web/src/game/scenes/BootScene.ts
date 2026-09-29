import Phaser from 'phaser';
import { queueMissingTextures, warnFailedTexture } from '../assetManifest';
import { PALETTE } from '../constants';
import { generatePlaceholderTextures } from '../textures';
import { WorldScene, type WorldOptions } from './WorldScene';

export class BootScene extends Phaser.Scene {
  static readonly KEY = 'Boot';

  constructor() {
    super(BootScene.KEY);
  }

  preload(): void {
    // A missing or broken file must not blank the game: warn and let placeholders stand in.
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, warnFailedTexture);
    // Shared textures (player, paper) plus only the start scene's; other scenes load on entry.
    const { caseDefinition, scene } = this.registry.get('world') as WorldOptions;
    queueMissingTextures(this, [...caseDefinition.sharedTextures, ...scene.textures]);
  }

  create(): void {
    this.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR, warnFailedTexture);
    this.cameras.main.setBackgroundColor(PALETTE.inkBlack);
    generatePlaceholderTextures(this);
    this.scene.start(WorldScene.KEY);
  }
}
