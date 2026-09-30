import { describe, expect, it } from 'vitest';
import type { SceneDefinition } from '@lexicon/shared-types';
import { projectScenePoint, projectWorldBounds, projectInteractionAnchor } from './sceneProjection';

const projection = {
  type: 'dimetric-2:1' as const,
  originX: 100,
  originY: 50,
  tileWidth: 128 as const,
  tileHeight: 64 as const,
};

describe('scene projection adapter', () => {
  it('keeps interaction range on the floor when artwork elevation changes', () => {
    expect(projectInteractionAnchor({ projection }, { u: 2, v: 3, elevationPx: 0 })).toEqual({
      x: 36,
      y: 210,
    });
    expect(projectInteractionAnchor({ projection }, { u: 2, v: 3, elevationPx: 52 })).toEqual({
      x: 36,
      y: 210,
    });
  });
  it('keeps legacy screen points unchanged', () => {
    expect(projectScenePoint({ projection }, { x: 12, y: 34 })).toEqual({ x: 12, y: 34 });
  });

  it('projects logical points when a dimetric projection is declared', () => {
    expect(projectScenePoint({ projection }, { u: 1, v: -1 })).toEqual({ x: 228, y: 50 });
    expect(projectScenePoint({} as Pick<SceneDefinition, 'projection'>, { u: 1, v: -1 })).toEqual({
      x: 1,
      y: -1,
    });
  });

  it('projects all logical world-bound corners to a screen bounding rectangle', () => {
    expect(projectWorldBounds({ u: 0, v: 0, width: 2, height: 1 }, projection)).toEqual({
      x: 36,
      y: 50,
      width: 192,
      height: 96,
    });
  });
});
