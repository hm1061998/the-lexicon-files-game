import Phaser from 'phaser';
import { LABEL_FONT_FAMILY, PALETTE } from '../constants';

/** Room sign text size in world pixels (about 16 CSS px at the usual camera zoom). */
const LABEL_FONT_PX = 26;
const PAD_X = 14;
const PAD_Y = 7;
const BORDER_PX = 2;
const PIN_R = 2.5;

/**
 * A room sign: ink lettering on a small paper plate, drawn from content. Decoration only (no
 * input, no game logic). Returned as one container so the scene can destroy it on shutdown.
 */
export function createRoomLabel(
  scene: Phaser.Scene,
  label: { id: string; text: string; x: number; y: number; angle?: number | undefined },
  depth: number,
): Phaser.GameObjects.Container {
  const text = scene.add.text(0, 0, label.text, {
    fontFamily: LABEL_FONT_FAMILY,
    fontSize: `${LABEL_FONT_PX}px`,
    fontStyle: 'bold',
    color: PALETTE.inkBlack,
    resolution: 2,
  });
  text.setOrigin(0.5, 0.5);
  text.setLetterSpacing(2);
  const width = Math.ceil(text.width) + PAD_X * 2;
  const height = Math.ceil(text.height) + PAD_Y * 2;
  const color = (hex: string) => Phaser.Display.Color.HexStringToColor(hex).color;
  const plate = scene.add.graphics();
  // Hard offset shadow (no blur), paper plate, ink border and two pins.
  plate.fillStyle(color(PALETTE.darkBrown), 0.35);
  plate.fillRect(-width / 2 + 3, -height / 2 + 3, width, height);
  plate.fillStyle(color(PALETTE.paperCream), 1);
  plate.fillRect(-width / 2, -height / 2, width, height);
  plate.lineStyle(BORDER_PX, color(PALETTE.darkBrown), 1);
  plate.strokeRect(-width / 2, -height / 2, width, height);
  plate.fillStyle(color(PALETTE.darkBrown), 1);
  plate.fillCircle(-width / 2 + 6, -height / 2 + 6, PIN_R);
  plate.fillCircle(width / 2 - 6, -height / 2 + 6, PIN_R);
  const sign = scene.add.container(label.x, label.y, [plate, text]);
  sign.setAngle(label.angle ?? 0);
  sign.setDepth(depth);
  return sign;
}
