import Phaser from 'phaser';
import { LABEL_FONT_FAMILY, PALETTE } from '../constants';

export type NpcNameplate = {
  container: Phaser.GameObjects.Container;
  text: Phaser.GameObjects.Text;
  width: number;
  height: number;
  /** True once the paper card and its pin are drawn; independent of how many children it has. */
  hasPaperPlate: boolean;
};

/**
 * A dossier tag pinned above the character's head: cream card, soft offset shadow, small pin.
 * It starts invisible; the scene fades it in and out by distance or hover.
 */
export function createNpcNameplate(scene: Phaser.Scene, name: string, depth: number): NpcNameplate {
  const text = scene.add
    .text(0, 0, name, {
      fontFamily: LABEL_FONT_FAMILY,
      fontSize: '18px',
      fontStyle: '500',
      color: PALETTE.inkBlack,
      resolution: 2,
      padding: { x: 10, y: 7 },
    })
    .setOrigin(0.5, 0.5);
  const width = Math.ceil(text.width);
  const height = Math.ceil(text.height);
  const color = (hex: string) => Phaser.Display.Color.HexStringToColor(hex).color;
  const plate = scene.add.graphics();
  // Soft shadow: stacked low-alpha rects offset 2-3px down-right (no blur available in Graphics).
  plate.fillStyle(color(PALETTE.darkBrown), 0.1);
  plate.fillRect(-width / 2 + 3, -height / 2 + 3, width, height);
  plate.fillStyle(color(PALETTE.darkBrown), 0.12);
  plate.fillRect(-width / 2 + 2, -height / 2 + 2, width, height);
  plate.fillStyle(color(PALETTE.paperCream), 0.98);
  plate.fillRect(-width / 2, -height / 2, width, height);
  plate.lineStyle(1, color(PALETTE.darkBrown), 0.6);
  plate.strokeRect(-width / 2, -height / 2, width, height);
  // Pin: the tag is a dossier tab, so a small dark-brown pin (red is reserved for clues).
  plate.fillStyle(color(PALETTE.darkBrown), 1);
  plate.fillCircle(0, -height / 2 + 4, 3);
  plate.fillStyle(color(PALETTE.paperCream), 0.8);
  plate.fillCircle(-1, -height / 2 + 3, 1);
  const container = scene.add.container(0, 0, [plate, text]).setDepth(depth).setAlpha(0);
  return { container, text, width, height, hasPaperPlate: true };
}
