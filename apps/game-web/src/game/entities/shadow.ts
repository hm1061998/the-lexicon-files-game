import type Phaser from 'phaser';
import { PALETTE } from '../constants';

/** Soft contact shadow under characters (docs/art/06 §18); generated, no blur. */
export const SHADOW_KEY = 'shadow_soft';
export const SHADOW_SIZE = { width: 44, height: 16 } as const;
export const SHADOW_ALPHA = 0.28;
const SHADOW_LAYERS = 4;

export type ShadowLayer = { width: number; height: number; alpha: number };

/** Concentric ellipses, outermost first; their stacked alpha at the centre is SHADOW_ALPHA. */
export function shadowLayers(): ShadowLayer[] {
  const alpha = 1 - Math.pow(1 - SHADOW_ALPHA, 1 / SHADOW_LAYERS);
  return Array.from({ length: SHADOW_LAYERS }, (_, i) => {
    const scale = 1 - (0.6 * i) / SHADOW_LAYERS;
    return {
      width: Math.round(SHADOW_SIZE.width * scale),
      height: Math.round(SHADOW_SIZE.height * scale),
      alpha,
    };
  });
}

type Anchor = { x: number; y: number; depth: number };

/** Centred on the feet (world position) and drawn just below the character. */
export function shadowPlacement(target: Anchor): Anchor {
  return { x: target.x, y: target.y, depth: target.depth - 1 };
}

function ensureShadowTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(SHADOW_KEY)) return;
  const { width, height } = SHADOW_SIZE;
  const ink = Number.parseInt(PALETTE.inkBlack.slice(1), 16);
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  for (const layer of shadowLayers()) {
    g.fillStyle(ink, layer.alpha);
    g.fillEllipse(width / 2, height / 2, layer.width, layer.height);
  }
  g.generateTexture(SHADOW_KEY, width, height);
  g.destroy();
}

/** Adds a shadow under `target`; scene objects are destroyed with the scene on shutdown. */
export function createShadow(scene: Phaser.Scene, target: Anchor): Phaser.GameObjects.Image {
  ensureShadowTexture(scene);
  const shadow = scene.add.image(0, 0, SHADOW_KEY);
  syncShadow(shadow, target);
  return shadow;
}

export function syncShadow(shadow: Phaser.GameObjects.Image, target: Anchor): void {
  const at = shadowPlacement(target);
  shadow.setPosition(at.x, at.y);
  shadow.setDepth(at.depth);
}
