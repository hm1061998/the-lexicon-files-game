import { describe, expect, it } from 'vitest';
import { NAMEPLATE_RADIUS_FACTOR } from '../constants';
import { nameplateVisible } from './nameplateVisibility';

const npcFeet = { x: 400, y: 300 };
const radius = 90;
const base = { npcFeet, interactionRadius: radius, hovered: false };

describe('nameplateVisible', () => {
  it('uses 1.5x the interaction radius', () => {
    expect(NAMEPLATE_RADIUS_FACTOR).toBe(1.5);
  });

  it('is visible exactly on the 1.5x boundary and hidden 1px beyond it', () => {
    const edge = radius * NAMEPLATE_RADIUS_FACTOR;
    expect(nameplateVisible({ ...base, player: { x: 400 + edge, y: 300 } })).toBe(true);
    expect(nameplateVisible({ ...base, player: { x: 400 + edge + 1, y: 300 } })).toBe(false);
  });

  it('measures straight-line distance, not per axis', () => {
    const d = (radius * NAMEPLATE_RADIUS_FACTOR) / Math.SQRT2;
    expect(nameplateVisible({ ...base, player: { x: 400 + d, y: 300 + d } })).toBe(true);
    expect(nameplateVisible({ ...base, player: { x: 400 + d + 1, y: 300 + d + 1 } })).toBe(false);
  });

  it('stays visible while hovered, however far the player is', () => {
    expect(nameplateVisible({ ...base, hovered: true, player: { x: 4000, y: 3000 } })).toBe(true);
  });

  it('is hidden for a distant player when not hovered', () => {
    expect(nameplateVisible({ ...base, player: { x: 4000, y: 3000 } })).toBe(false);
  });

  it('shows both plates when the player is inside two NPCs radii at once', () => {
    const player = { x: 500, y: 300 };
    const first = nameplateVisible({ ...base, npcFeet: { x: 450, y: 300 }, player });
    const second = nameplateVisible({ ...base, npcFeet: { x: 560, y: 320 }, player });
    expect(first && second).toBe(true);
  });
});
