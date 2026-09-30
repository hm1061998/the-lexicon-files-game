import { describe, expect, it } from 'vitest';
import { loadCaseDefinition } from '@lexicon/game-content';
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

  it('models every real scene: one marker per interaction, each collision a solid or partition', () => {
    for (const real of caseDefinition.scenes) {
      const model = buildMinimapModel(real, null);
      expect(model.markers).toHaveLength(real.assets.filter((a) => a.interaction).length);
      expect(model.solids.length + model.partitions.length).toBe(
        real.assets.filter((a) => a.collision).length,
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
