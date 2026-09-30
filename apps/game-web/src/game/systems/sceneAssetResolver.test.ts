import { describe, expect, it } from 'vitest';
import { resolveSceneAssets } from './sceneAssetResolver';
import type { SceneAssetDefinition } from '@lexicon/shared-types';

const asset = (values: Record<string, unknown>) => values as unknown as SceneAssetDefinition;

describe('resolveSceneAssets', () => {
  it('exposes footprint independently and preserves logical anchors across visual transforms', () => {
    const base = asset({
      id: 'desk',
      type: 'prop',
      texture: 'desk',
      position: { u: 2, v: 3 },
      footprint: { u: -1, v: -1, width: 2, height: 2 },
      collision: { type: 'rect', u: -0.5, v: -0.5, width: 1, height: 1 },
      interaction: { x: 0, y: 0.6, radius: 80, prompt: 'Use' },
      origin: [0.5, 0.9],
      scale: 1,
      elevationPx: 0,
    });
    const [a] = resolveSceneAssets([base]);
    const [b] = resolveSceneAssets([{ ...base, origin: [0.1, 0.2], scale: 3, elevationPx: 40 }]);
    expect(a!.footprint).toEqual({ type: 'rect', u: 1, v: 2, width: 2, height: 2 });
    expect(b!.footprint).toEqual(a!.footprint);
    expect(b!.collision).toEqual(a!.collision);
    expect(b!.floorAnchor).toEqual(a!.floorAnchor);
    expect(b!.interactionAnchor).toMatchObject({ u: 2, v: 3.6 });
    expect(b!.visualAnchor.elevationPx).toBe(40);
  });
  it('resolves a tabletop child after its parent and keeps floor depth separate from elevation', () => {
    const assets = [
      asset({
        id: 'note',
        type: 'interactable',
        texture: 'note',
        restsOn: 'desk',
        surfaceOffset: { u: 0.25, v: 0.5, elevationPx: 42 },
        origin: [0.5, 0.5],
        scale: 1,
        depthBias: 0,
      }),
      asset({
        id: 'desk',
        type: 'prop',
        texture: 'desk',
        position: { u: 2, v: 3 },
        elevationPx: 6,
        origin: [0.5, 1],
        scale: 1,
        depthBias: 0,
        collision: { type: 'rect', u: -1, v: -0.5, width: 2, height: 1 },
      }),
    ];
    const resolved = resolveSceneAssets(assets);
    expect(resolved.map(({ id }) => id)).toEqual(['desk', 'note']);
    expect(resolved[1]).toMatchObject({
      floorAnchor: { u: 2.25, v: 3.5 },
      visualAnchor: { u: 2.25, v: 3.5, elevationPx: 48 },
      interactionAnchor: null,
      collision: null,
    });
  });

  it.each([
    [
      'unknown',
      { id: 'desk', position: { u: 1, v: 1 } },
      { id: 'paper', restsOn: 'missing', surfaceOffset: { u: 0, v: 0, elevationPx: 2 } },
    ],
    ['self', { id: 'self', restsOn: 'self', surfaceOffset: { u: 0, v: 0, elevationPx: 2 } }],
    [
      'cycle',
      { id: 'a', restsOn: 'b', surfaceOffset: { u: 0, v: 0, elevationPx: 2 } },
      { id: 'b', restsOn: 'a', surfaceOffset: { u: 0, v: 0, elevationPx: 2 } },
    ],
  ])('rejects unknown parents, self-parenting and dependency cycles', (_label, ...items) => {
    expect(() =>
      resolveSceneAssets(items.map((item) => asset(item as Record<string, unknown>))),
    ).toThrow();
  });

  it('rejects duplicate ids', () => {
    expect(() =>
      resolveSceneAssets([asset({ id: 'a', x: 1, y: 1 }), asset({ id: 'a', x: 2, y: 2 })]),
    ).toThrow(/duplicate/i);
  });

  it('keeps a child interaction at its elevated surface while leaving parent collision behind', () => {
    const parent = asset({
      id: 'desk',
      position: { u: 1, v: 1 },
      collision: { type: 'rect', u: 0, v: 0, width: 1, height: 1 },
    });
    const child = asset({
      id: 'note',
      restsOn: 'desk',
      surfaceOffset: { u: 0.5, v: 0, elevationPx: 40 },
      interaction: { x: 0, y: 0, radius: 24, prompt: 'Read' },
    });
    const resolved = resolveSceneAssets([parent, child]);
    expect(resolved[1]?.interactionAnchor).toEqual({ u: 1.5, v: 1, elevationPx: 40 });
    expect(resolved[1]?.collision).toBeNull();
  });
});
