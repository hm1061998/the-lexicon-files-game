import { describe, expect, it } from 'vitest';
import type { SceneAssetDefinition } from '@lexicon/shared-types';
import { OCCLUDED_ALPHA, isOccluder, occluderAlpha } from './occlusion';

const WORLD_WIDTH = 2400;

function asset(overrides: Partial<SceneAssetDefinition>): SceneAssetDefinition {
  return {
    id: 'a',
    type: 'prop',
    texture: 't',
    x: 0,
    y: 0,
    origin: [0.5, 1],
    scale: 1,
    depthBias: 0,
    ...overrides,
  };
}

describe('isOccluder', () => {
  it('treats inner walls and wall-hung boards as occluders', () => {
    const inner = asset({
      type: 'wall',
      collision: { type: 'rect', x: -300, y: -24, width: 600, height: 24 },
    });
    expect(isOccluder(inner, WORLD_WIDTH)).toBe(true);
    expect(isOccluder(asset({ type: 'prop' }), WORLD_WIDTH)).toBe(true);
  });

  it('leaves the full-width back wall, furniture, evidence and characters alone', () => {
    const back = asset({
      type: 'wall',
      collision: { type: 'rect', x: -1200, y: -40, width: 2400, height: 40 },
    });
    const desk = asset({ collision: { type: 'rect', x: -10, y: -10, width: 20, height: 10 } });
    expect(isOccluder(back, WORLD_WIDTH)).toBe(false);
    expect(isOccluder(desk, WORLD_WIDTH)).toBe(false);
    expect(isOccluder(asset({ type: 'interactable' }), WORLD_WIDTH)).toBe(false);
    expect(isOccluder(asset({ type: 'npc' }), WORLD_WIDTH)).toBe(false);
    expect(isOccluder(asset({ type: 'background' }), WORLD_WIDTH)).toBe(false);
  });
});

describe('occluderAlpha', () => {
  const wall = { x: 0, y: 756, width: 1084, height: 184 };
  const figure = (x: number, feetY: number) => ({
    x: x - 20,
    y: feetY - 100,
    width: 40,
    height: 100,
  });

  it('fades a wall the player stands behind and overlaps on screen', () => {
    expect(occluderAlpha(wall, 940, figure(500, 880), 880)).toBe(OCCLUDED_ALPHA);
  });

  it('keeps the wall opaque when the player is in front of it', () => {
    expect(occluderAlpha(wall, 940, figure(500, 1000), 1000)).toBe(1);
  });

  it('keeps the wall opaque when the player is behind it but not covered by it', () => {
    expect(occluderAlpha(wall, 940, figure(1300, 880), 880)).toBe(1);
    expect(occluderAlpha(wall, 940, figure(500, 600), 600)).toBe(1);
  });

  it('uses the 45% fade from docs/art/06 §29', () => {
    expect(OCCLUDED_ALPHA).toBe(0.45);
  });
});
