import { describe, expect, it } from 'vitest';
import type { SceneDefinition } from '@lexicon/shared-types';
import { projectScenePoint, projectWorldBounds } from './sceneProjection';

const projection = {
  type: 'dimetric-2:1' as const,
  originX: 100,
  originY: 50,
  tileWidth: 128 as const,
  tileHeight: 64 as const,
};

describe('scene projection adapter', () => {
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
