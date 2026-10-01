import Phaser from 'phaser';
import { LABEL_FONT_FAMILY, PALETTE } from '../constants';

export type NpcNameplate = {
  container: Phaser.GameObjects.Container;
  text: Phaser.GameObjects.Text;
  width: number;
  height: number;
};

/** A compact dossier-paper nameplate that stays above the character's head. */
export function createNpcNameplate(scene: Phaser.Scene, name: string, depth: number): NpcNameplate {
  const text = scene.add
    .text(0, 0, name, {
      fontFamily: LABEL_FONT_FAMILY,
      fontSize: '20px',
      fontStyle: 'bold',
      color: PALETTE.inkBlack,
      resolution: 2,
      padding: { x: 8, y: 5 },
    })
    .setOrigin(0.5, 0.5);
  const width = Math.ceil(text.width);
  const height = Math.ceil(text.height);
  const color = (hex: string) => Phaser.Display.Color.HexStringToColor(hex).color;
  const plate = scene.add.graphics();
  plate.fillStyle(color(PALETTE.darkBrown), 0.28);
  plate.fillRect(-width / 2 + 2, -height / 2 + 2, width, height);
  plate.fillStyle(color(PALETTE.paperCream), 0.98);
  plate.fillRect(-width / 2, -height / 2, width, height);
  plate.lineStyle(1, color(PALETTE.darkBrown), 0.95);
  plate.strokeRect(-width / 2, -height / 2, width, height);
  plate.fillStyle(color(PALETTE.darkBrown), 0.8);
  plate.fillRect(-width / 2 + 1, -height / 2 + 1, width - 2, 2);
  const container = scene.add.container(0, 0, [plate, text]).setDepth(depth);
  return { container, text, width, height };
}
