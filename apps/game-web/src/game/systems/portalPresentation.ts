import type Phaser from 'phaser';
import { LABEL_FONT_FAMILY, PALETTE } from '../constants';
import type { ScreenPoint } from './isometricProjection';
import type { PortalFacing } from './portalFacing';

/** Warm light on the floor in front of a portal (spec D-6): additive, soft, small. */
export const LIGHT_ALPHA_MAX = 0.32;
export const LIGHT_RADIUS_TILES_MAX = 1.2;

const TILE_HALF_WIDTH = 64;
const TILE_HALF_HEIGHT = 32;
const VEIL_FPS = 8;
const VEIL_FRAMES = 10;
/** Where the arch stands on the veil frame (base y 224 of a 256px frame). */
const VEIL_ORIGIN_Y = 224 / 256;
const MOTE_COUNT = 6;
const SIGN_HEIGHT_PX = 208;
const WARM = 0xf0dfa8;
const DRIFT_MS = 8000;

type Args = {
  position: ScreenPoint;
  facing: PortalFacing;
  reducedMotion: boolean;
  /** Room name on the sign above the arch (the destination, from content); omitted when unknown. */
  label?: string | undefined;
};

/**
 * The living part of a wall arch: the warm veil in the opening, dust drifting up, light on the
 * floor in front, and the destination sign. The arch itself is the scene asset's sprite.
 * Reduced motion shows veil frame 0, no motes, and creates no tween or timer.
 */
export function createPortalPresentation(
  scene: Phaser.Scene,
  args: Args,
): { setReducedMotion(value: boolean): void; destroy(): void } {
  const { position, facing } = args;
  let reducedMotion = args.reducedMotion;
  // Far walls share the near walls' on-screen slant, so only the light flips sides, never the art.
  const flip = facing.endsWith('flip');
  const art = facing.startsWith('ne') ? 'ne' : 'nw';
  // The room side of the wall, in screen space: a wall along v opens towards +u, along u towards +v.
  const toRoom = { x: art === 'ne' ? 1 : -1, y: 0.5 };
  const side = flip ? -1 : 1;

  const veilKey = `sheet_portal_veil_${art}`;
  const veil = scene.textures.exists(veilKey)
    ? scene.add
        .sprite(position.x, position.y, veilKey, 0)
        .setOrigin(0.5, VEIL_ORIGIN_Y)
        .setDepth(position.y + 0.002)
    : null;

  const light = scene.add
    .graphics()
    .setDepth(position.y + 0.001)
    .setBlendMode('ADD');
  const motes = scene.add.graphics().setDepth(position.y + 0.003);
  const sign = args.label
    ? scene.add
        .text(position.x, position.y - SIGN_HEIGHT_PX, args.label, {
          fontFamily: LABEL_FONT_FAMILY,
          fontSize: '14px',
          color: PALETTE.inkBlack,
          backgroundColor: PALETTE.paperCream,
          padding: { x: 8, y: 4 },
          resolution: 2,
        })
        .setOrigin(0.5, 1)
        .setDepth(position.y + 0.004)
    : null;

  const lightCenter = {
    x: position.x + side * toRoom.x * TILE_HALF_WIDTH * 0.8,
    y: position.y + side * toRoom.y * TILE_HALF_WIDTH * 0.8,
  };
  const drawLight = (): void => {
    const rx = LIGHT_RADIUS_TILES_MAX * TILE_HALF_WIDTH;
    const ry = LIGHT_RADIUS_TILES_MAX * TILE_HALF_HEIGHT;
    light.clear();
    light
      .fillStyle(WARM, LIGHT_ALPHA_MAX * 0.55)
      .fillEllipse(lightCenter.x, lightCenter.y, rx * 2, ry * 2);
    light
      .fillStyle(WARM, LIGHT_ALPHA_MAX * 0.45)
      .fillEllipse(lightCenter.x, lightCenter.y, rx * 1.2, ry * 1.2);
  };

  const phase = { value: 0 };
  const drawMotes = (): void => {
    motes.clear();
    if (reducedMotion) return;
    for (let i = 0; i < MOTE_COUNT; i += 1) {
      const t = (phase.value + i / MOTE_COUNT) % 1;
      const x = position.x + Math.sin(i * 2.3 + t * 5) * 18;
      const y = position.y - 24 - t * 120;
      motes.fillStyle(WARM, 0.3 * (1 - t)).fillCircle(x, y, 1.5);
    }
  };

  let tween: Phaser.Tweens.Tween | null = null;
  let timer: Phaser.Time.TimerEvent | null = null;
  let frame = 0;
  const stopMotion = (): void => {
    tween?.stop();
    tween?.remove();
    tween = null;
    timer?.remove();
    timer = null;
  };
  const sync = (): void => {
    stopMotion();
    frame = 0;
    veil?.setFrame(0);
    drawLight();
    drawMotes();
    if (reducedMotion) return;
    timer = scene.time.addEvent({
      delay: 1000 / VEIL_FPS,
      loop: true,
      callback: () => {
        frame = (frame + 1) % VEIL_FRAMES;
        veil?.setFrame(frame);
      },
    });
    tween = scene.tweens.add({
      targets: phase,
      value: 1,
      duration: DRIFT_MS,
      repeat: -1,
      onUpdate: drawMotes,
    });
  };
  sync();

  return {
    setReducedMotion(value) {
      if (value === reducedMotion) return;
      reducedMotion = value;
      sync();
    },
    destroy() {
      stopMotion();
      light.destroy();
      motes.destroy();
      veil?.destroy();
      sign?.destroy();
    },
  };
}
