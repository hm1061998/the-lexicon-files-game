import { describe, expect, it } from 'vitest';
import type { SceneDefinition, SceneAssetDefinition } from '@lexicon/shared-types';
import { validateSceneGeometry } from './sceneGeometry';

const asset = (id: string, u: number, v: number, w = 1, h = 1): SceneAssetDefinition => ({
  id,
  type: 'prop',
  texture: 'ph_prop',
  position: { u, v },
  origin: [0.5, 1],
  scale: 1,
  depthBias: 0,
  footprint: { u: 0, v: 0, width: w, height: h },
  collision: { type: 'rect', u: 0, v: 0, width: w, height: h },
});
const room = (assets: SceneAssetDefinition[] = []): SceneDefinition => ({
  id: 'room',
  projection: { type: 'dimetric-2:1', originX: 0, originY: 0, tileWidth: 128, tileHeight: 64 },
  size: { width: 600, height: 400 },
  worldBounds: { u: 0, v: 0, width: 8, height: 8 },
  spawnPoints: { default: { u: 1, v: 5 } },
  assets,
  walls: [],
  textures: [],
});
describe('validateSceneGeometry', () => {
  it('accepts an open room', () => expect(validateSceneGeometry(room())).toEqual([]));
  it('rejects overlapping solids naming both IDs', () =>
    expect(validateSceneGeometry(room([asset('a', 3, 3), asset('b', 3.5, 3.5)])).join()).toMatch(
      /a.*b/,
    ));
  it('rejects a collision outside bounds naming its ID', () =>
    expect(validateSceneGeometry(room([asset('outside', 7.5, 7.5)])).join()).toContain('outside'));
  it('rejects a spawn in a solid', () =>
    expect(validateSceneGeometry(room([asset('block', 0.5, 4.5)])).join()).toContain(
      'spawn "default"',
    ));
  it('treats a 0.30 gap as closed for the 0.36 body', () => {
    const r = room([asset('left', 0, 3, 3.85, 0.5), asset('right', 4.15, 3, 3.85, 0.5)]);
    const target = {
      ...asset('target', 4, 1),
      collision: undefined,
      interaction: { x: 0, y: 0, radius: 24, prompt: 'Use' },
    };
    expect(validateSceneGeometry({ ...r, assets: [...r.assets, target] }).join()).toContain(
      'target',
    );
  });
  it('requires module textures and rejects obstructed doorway clearance', () => {
    const r = {
      ...room([asset('block', 0.1, 4, 0.8, 1.3)]),
      walls: [
        {
          id: 'west',
          kind: 'office' as const,
          axis: 'v' as const,
          line: 0,
          start: 0,
          end: 8,
          openings: [{ id: 'door', start: 4, end: 6 }],
        },
      ],
    };
    const errors = validateSceneGeometry(r).join();
    expect(errors).toContain('texture');
    expect(errors).toContain('door');
  });
});
