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

  it('models every real scene: one marker per interaction, one solid per collision', () => {
    for (const real of caseDefinition.scenes) {
      const model = buildMinimapModel(real, null);
      expect(model.markers).toHaveLength(real.assets.filter((a) => a.interaction).length);
      expect(model.solids).toHaveLength(real.assets.filter((a) => a.collision).length);
    }
  });
});
