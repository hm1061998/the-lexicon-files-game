import Phaser from 'phaser';
import { LABEL_FONT_FAMILY, PALETTE } from '../constants';
import type { LabelPlane } from '../systems/labelPlane';

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
  label: {
    id: string;
    text: string;
    x: number;
    y: number;
    angle?: number | undefined;
    plane?: LabelPlane | undefined;
  },
  depth: number,
): Phaser.GameObjects.Container {
  if (label.plane) return createMountedLabel(scene, label.text, label.plane);
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

/** Rasterize the affine plane once; no per-frame text drawing or collider. */
function createMountedLabel(
  scene: Phaser.Scene,
  text: string,
  plane: LabelPlane,
): Phaser.GameObjects.Container {
  const key = `label-${Phaser.Utils.String.UUID()}`;
  const probe = scene.textures.createCanvas(key, 1, 1);
  if (!probe) throw new Error('Room label canvas texture could not be created');
  const font = `bold ${LABEL_FONT_PX}px ${LABEL_FONT_FAMILY}`;
  probe.context.font = font;
  const width = Math.ceil(probe.context.measureText(text).width) + PAD_X * 2,
    height = LABEL_FONT_PX + PAD_Y * 2;
  const { basisX: a, basisY: b } = plane;
  const corners = [
    [-width / 2, -height / 2],
    [width / 2, -height / 2],
    [-width / 2, height / 2],
    [width / 2, height / 2],
  ].map(([x, y]) => ({ x: a.x * x! + b.x * y!, y: a.y * x! + b.y * y! }));
  const minX = Math.floor(Math.min(...corners.map((p) => p.x))) - 2,
    minY = Math.floor(Math.min(...corners.map((p) => p.y))) - 2;
  const w = Math.ceil(Math.max(...corners.map((p) => p.x))) - minX + 2,
    h = Math.ceil(Math.max(...corners.map((p) => p.y))) - minY + 2;
  probe.setSize(w, h);
  const ctx = probe.context;
  ctx.translate(-minX, -minY);
  ctx.transform(a.x, a.y, b.x, b.y, 0, 0);
  ctx.fillStyle = PALETTE.paperCream;
  ctx.globalAlpha = b.x === 0 ? 0.95 : 0.72;
  ctx.fillRect(-width / 2, -height / 2, width, height);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = PALETTE.darkBrown;
  ctx.lineWidth = 1;
  ctx.strokeRect(-width / 2, -height / 2, width, height);
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PALETTE.inkBlack;
  ctx.fillText(text, 0, 0);
  probe.refresh();
  const image = scene.add.image(minX, minY, key).setOrigin(0, 0);
  const sign = scene.add.container(plane.anchor.x, plane.anchor.y, [image]).setDepth(plane.depth);
  sign.once(Phaser.GameObjects.Events.DESTROY, () => scene.textures.remove(key));
  return sign;
}
