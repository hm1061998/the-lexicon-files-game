import Phaser from 'phaser';
import { INTERACTION_RED, PALETTE } from './constants';

type PlaceholderSpec = {
  key: string;
  width: number;
  height: number;
  fill: string;
  stroke?: string;
};

const toColor = (hex: string): number => Phaser.Display.Color.HexStringToColor(hex).color;

/** Grey-box placeholders (docs/art/06 §52-53) until real art lands. */
const PLACEHOLDERS: readonly PlaceholderSpec[] = [
  { key: 'ph_floor', width: 2400, height: 1600, fill: PALETTE.lightBeige },
  { key: 'ph_wall', width: 2400, height: 220, fill: PALETTE.darkBrown, stroke: PALETTE.inkBlack },
  { key: 'ph_desk', width: 240, height: 120, fill: PALETTE.warmGray, stroke: PALETTE.inkBlack },
  { key: 'ph_note', width: 40, height: 30, fill: PALETTE.paperCream, stroke: PALETTE.inkBlack },
  { key: 'ph_door', width: 110, height: 200, fill: PALETTE.mutedGreen, stroke: PALETTE.inkBlack },
  { key: 'ph_npc', width: 48, height: 100, fill: PALETTE.mutedGreen, stroke: PALETTE.inkBlack },
  { key: 'ph_player', width: 48, height: 100, fill: PALETTE.darkBrown, stroke: PALETTE.paperCream },
  { key: 'ph_marker', width: 24, height: 24, fill: INTERACTION_RED },
  { key: 'ph_missing', width: 64, height: 64, fill: '#FF00FF' },
];

export function generatePlaceholderTextures(scene: Phaser.Scene): void {
  for (const spec of PLACEHOLDERS) {
    if (scene.textures.exists(spec.key)) continue;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(toColor(spec.fill), 1);
    g.fillRect(0, 0, spec.width, spec.height);
    if (spec.stroke) {
      g.lineStyle(4, toColor(spec.stroke), 1);
      g.strokeRect(2, 2, spec.width - 4, spec.height - 4);
    }
    g.generateTexture(spec.key, spec.width, spec.height);
    g.destroy();
  }
}
