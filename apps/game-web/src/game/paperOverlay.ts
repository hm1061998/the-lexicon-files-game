import Phaser from 'phaser';
import { PALETTE, PAPER_OVERLAY_ALPHA, PAPER_OVERLAY_KEY } from './constants';

const TILE_SIZE = 256;
const GRAIN_DOTS = 900;
const PAPER_OVERLAY_DEPTH = 9000;

/** Deterministic PRNG so the generated grain is identical every run. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Draws a subtle paper-grain tile. Skipped when the key already exists so a
 * real texture loaded during preload can take over the same key.
 */
export function generatePaperOverlayTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(PAPER_OVERLAY_KEY)) return;
  const canvas = scene.textures.createCanvas(PAPER_OVERLAY_KEY, TILE_SIZE, TILE_SIZE);
  if (!canvas) return;
  const ctx = canvas.getContext();
  ctx.fillStyle = PALETTE.paperCream;
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  const random = mulberry32(1001);
  for (let i = 0; i < GRAIN_DOTS; i += 1) {
    const dark = random() < 0.5;
    ctx.fillStyle = dark ? PALETTE.warmGray : PALETTE.lightBeige;
    ctx.globalAlpha = 0.25 + random() * 0.5;
    ctx.fillRect(Math.floor(random() * TILE_SIZE), Math.floor(random() * TILE_SIZE), 1, 1);
  }
  ctx.globalAlpha = 1;
  canvas.refresh();
}

/** Viewport-fixed, non-interactive paper grain above the world, below the marker. */
export function addPaperOverlay(scene: Phaser.Scene): Phaser.GameObjects.TileSprite {
  const { width, height } = scene.scale;
  const overlay = scene.add.tileSprite(0, 0, width, height, PAPER_OVERLAY_KEY);
  overlay.setOrigin(0, 0);
  overlay.setScrollFactor(0);
  overlay.setDepth(PAPER_OVERLAY_DEPTH);
  overlay.setAlpha(PAPER_OVERLAY_ALPHA);
  return overlay;
}
