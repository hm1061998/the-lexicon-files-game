import Phaser from 'phaser';

/** Palette "Ink Black" — docs/art/06 §palette. */
const INK_BLACK = '#2A2521';

export class BootScene extends Phaser.Scene {
  static readonly KEY = 'Boot';

  constructor() {
    super(BootScene.KEY);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(INK_BLACK);
  }
}
