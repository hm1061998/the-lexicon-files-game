import { expect, it } from 'vitest';
import type { SceneDefinition } from '@lexicon/shared-types';
import { resolveLabelPlane } from './labelPlane';

const definition: SceneDefinition = {
  id: 'room',
  projection: { type: 'dimetric-2:1', originX: 832, originY: 180, tileWidth: 128, tileHeight: 64 },
  size: { width: 1920, height: 1080 },
  worldBounds: { u: 0, v: 0, width: 16, height: 12 },
  spawnPoints: { default: { u: 1, v: 1 } },
  textures: [],
  assets: [],
  walls: [
    { id: 'back', kind: 'office', axis: 'u', line: 0, start: 0, end: 16, openings: [] },
    { id: 'west', kind: 'office', axis: 'v', line: 0, start: 0, end: 12, openings: [] },
  ],
};
it('projects a floor label into the two floor axes without raising it above actors', () => {
  const plane = resolveLabelPlane(
    { id: 'hall', text: 'Hall', u: 8, v: 5, mount: { kind: 'floor' } },
    definition,
  );
  expect(plane.anchor).toEqual({ x: 1024, y: 596 });
  expect(plane.basisX).toEqual({ x: 1, y: 0.5 });
  expect(plane.basisY).toEqual({ x: -1, y: 0.5 });
  expect(plane.depth).toBeLessThan(596);
  expect(plane.depth).toBeGreaterThan(0); // Above the floor (depth 0), below every standing prop.
});
it('keeps wall text upright along each wall axis and applies elevation to visual only', () => {
  const back = resolveLabelPlane(
    {
      id: 'room',
      text: 'Room',
      u: 3,
      v: 0,
      mount: { kind: 'wall', wallId: 'back', elevationPx: 48 },
    },
    definition,
  );
  expect(back.anchor).toEqual({ x: 1024, y: 228 });
  expect(back.basisX).toEqual({ x: 1, y: 0.5 });
  expect(back.basisY).toEqual({ x: 0, y: 1 });
  expect(back.depth).toBeGreaterThan(296); // Adjacent wall module's floor contact.
  const west = resolveLabelPlane(
    {
      id: 'room',
      text: 'Room',
      u: 0,
      v: 8,
      mount: { kind: 'wall', wallId: 'west', elevationPx: 48 },
    },
    definition,
  );
  expect(west.anchor).toEqual({ x: 320, y: 388 });
  expect(west.basisX).toEqual({ x: 1, y: -0.5 });
});
