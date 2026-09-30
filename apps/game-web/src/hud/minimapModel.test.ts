import { describe, expect, it } from 'vitest';
import { loadCaseDefinition, expandWalls } from '@lexicon/game-content';
import type { SceneAssetDefinition, SceneDefinition } from '@lexicon/shared-types';
import { buildMinimapModel } from './minimapModel';

const caseDefinition = loadCaseDefinition('case-001');

function asset(overrides: Partial<SceneAssetDefinition>): SceneAssetDefinition {
  return {
    id: 'a',
    type: 'prop',
    texture: 't',
    x: 100,
    y: 200,
    origin: [0.5, 1],
    scale: 1,
    depthBias: 0,
    ...overrides,
  };
}

function scene(assets: SceneAssetDefinition[]): SceneDefinition {
  return {
    id: 's',
    size: { width: 2400, height: 1600 },
    worldBounds: { x: 0, y: 160, width: 2400, height: 1440 },
    spawnPoints: { default: { x: 0, y: 0 } },
    textures: [],
    assets,
  };
}

describe('buildMinimapModel', () => {
  it('uses worldBounds (not size) for the view box', () => {
    expect(buildMinimapModel(scene([]), null).viewBox).toBe('0 160 2400 1440');
  });

  it('converts collision rects to world coordinates', () => {
    const model = buildMinimapModel(
      scene([
        asset({ collision: { type: 'rect', x: -10, y: -20, width: 40, height: 20 } }),
        asset({ id: 'b' }),
      ]),
      null,
    );
    expect(model.solids).toEqual([{ x: 90, y: 180, width: 40, height: 20 }]);
  });

  it('adds a marker per interaction, classified by transition and npc', () => {
    const model = buildMinimapModel(
      scene([
        asset({
          id: 'note',
          type: 'interactable',
          interaction: { x: 5, y: -5, radius: 40, prompt: 'p' },
        }),
        asset({
          id: 'door',
          type: 'interactable',
          interaction: {
            x: 0,
            y: 0,
            radius: 40,
            prompt: 'p',
            transition: { targetSceneId: 'x', targetSpawnId: 'y' },
          },
        }),
        asset({
          id: 'person',
          type: 'npc',
          interaction: { x: 0, y: 0, radius: 40, prompt: 'p', npcId: 'n' },
        }),
        asset({ id: 'plain' }),
      ]),
      null,
    );
    expect(model.markers).toEqual([
      { id: 'note', x: 105, y: 195, kind: 'interactable' },
      { id: 'door', x: 100, y: 200, kind: 'door' },
      { id: 'person', x: 100, y: 200, kind: 'npc' },
    ]);
  });

  it('has no player until a position is known, then echoes it', () => {
    const s = scene([]);
    expect(buildMinimapModel(s, null).player).toBeNull();
    expect(buildMinimapModel(s, { x: 3, y: 4 }).player).toEqual({ x: 3, y: 4 });
  });

  it('projects logical asset markers and player events through the same dimetric origin', () => {
    const s: SceneDefinition = {
      ...scene([
        {
          id: 'note',
          type: 'interactable',
          texture: 'note',
          position: { u: 2, v: 1 },
          origin: [0.5, 0.5],
          scale: 1,
          depthBias: 0,
          interaction: { x: 0, y: 0, radius: 40, prompt: 'Read' },
        },
      ]),
      projection: { type: 'dimetric-2:1', originX: 0, originY: 0, tileWidth: 128, tileHeight: 64 },
    };
    const model = buildMinimapModel(s, { x: 1, y: 1, coordinateSpace: 'logical' });
    expect(model.markers).toEqual([{ id: 'note', x: 64, y: 96, kind: 'interactable' }]);
    expect(model.player).toEqual({ x: 0, y: 64 });
  });

  it('projects logical collision footprints by their four corners', () => {
    const s: SceneDefinition = {
      ...scene([
        {
          id: 'desk',
          type: 'prop',
          texture: 'desk',
          position: { u: 2, v: 3 },
          origin: [0.5, 1],
          scale: 1,
          depthBias: 0,
          collision: { type: 'rect', u: -0.5, v: 0, width: 1, height: 1 },
        },
      ]),
      projection: {
        type: 'dimetric-2:1',
        originX: 100,
        originY: 50,
        tileWidth: 128,
        tileHeight: 64,
      },
    };
    expect(buildMinimapModel(s, null).solids).toEqual([{ x: -60, y: 194, width: 128, height: 64 }]);
  });

  it('projects a logical floor to a diamond and uses the projected bounds for its viewBox', () => {
    const s: SceneDefinition = {
      ...scene([]),
      projection: { type: 'dimetric-2:1', originX: 0, originY: 0, tileWidth: 128, tileHeight: 64 },
      worldBounds: { u: -1, v: -1, width: 2, height: 2 },
    };
    const model = buildMinimapModel(s, null);
    expect(model.viewBox).toBe('-128 -64 256 128');
    expect(model.floorPoints).toEqual('0,-64 128,0 0,64 -128,0');
  });

  it('projects logical asset markers and player events through the same dimetric origin', () => {
    const s: SceneDefinition = {
      ...scene([
        {
          id: 'note',
          type: 'interactable',
          texture: 'note',
          position: { u: 2, v: 1 },
          origin: [0.5, 0.5],
          scale: 1,
          depthBias: 0,
          interaction: { x: 0, y: 0, radius: 40, prompt: 'Read' },
        },
      ]),
      projection: { type: 'dimetric-2:1', originX: 0, originY: 0, tileWidth: 128, tileHeight: 64 },
    };
    const model = buildMinimapModel(s, { x: 1, y: 1, coordinateSpace: 'logical' });
    expect(model.markers).toEqual([{ id: 'note', x: 64, y: 96, kind: 'interactable' }]);
    expect(model.player).toEqual({ x: 0, y: 64 });
  });

  it('models every real scene: one marker per interaction, each collision a solid or partition', () => {
    for (const real of caseDefinition.scenes) {
      const model = buildMinimapModel(real, null);
      expect(model.markers).toHaveLength(real.assets.filter((a) => a.interaction).length);
      expect(model.solids.length + model.partitions.length).toBe(
        [...real.assets, ...expandWalls(real.walls ?? []).assets].filter((a) => a.collision).length,
      );
      expect(model.partitions.length, real.id).toBeGreaterThan(0);
    }
  });

  it('draws inner walls as partitions, keeping the full-width back wall a solid', () => {
    const model = buildMinimapModel(
      scene([
        asset({
          id: 'back',
          type: 'wall',
          collision: { type: 'rect', x: -100, y: -40, width: 2400, height: 40 },
        }),
        asset({
          id: 'inner',
          type: 'wall',
          x: 500,
          y: 900,
          collision: { type: 'rect', x: -300, y: -24, width: 600, height: 24 },
        }),
        asset({ id: 'desk', collision: { type: 'rect', x: 0, y: -10, width: 20, height: 10 } }),
      ]),
      null,
    );
    expect(model.partitions).toEqual([{ x: 200, y: 876, width: 600, height: 24 }]);
    expect(model.solids).toEqual([
      { x: 0, y: 160, width: 2400, height: 40 },
      { x: 100, y: 190, width: 20, height: 10 },
    ]);
  });

  it('places a dot per room label, without text', () => {
    const model = buildMinimapModel(
      { ...scene([]), labels: [{ id: 'room', text: 'PHÒNG', x: 300, y: 700 }] },
      null,
    );
    expect(model.labels).toEqual([{ id: 'room', text: 'PHÒNG', x: 300, y: 700 }]);
    expect(buildMinimapModel(scene([]), null).labels).toEqual([]);
  });

  it('scales marker radii in proportion to world width', () => {
    const narrow = buildMinimapModel(
      { ...scene([]), worldBounds: { x: 0, y: 0, width: 1200, height: 800 } },
      null,
    );
    const wide = buildMinimapModel(scene([]), null);
    expect(narrow.markerRadius).toBe(wide.markerRadius / 2);
    expect(narrow.playerRadius).toBe(wide.playerRadius / 2);
  });

  it('reports the nearest room label for the current player position', () => {
    const labeled = {
      ...scene([]),
      labels: [
        { id: 'meeting', text: 'PHÒNG HỌP', x: 300, y: 300 },
        { id: 'archive', text: 'KHO LƯU TRỮ', x: 900, y: 500 },
      ],
    };
    expect(buildMinimapModel(labeled, { x: 400, y: 300 }).currentRoomName).toBe('PHÒNG HỌP');
    expect(buildMinimapModel(labeled, null).currentRoomName).toBeNull();
  });
});
