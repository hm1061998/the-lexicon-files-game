import { expect, it } from 'vitest';
import { pickWorldTarget, pointerToLogical, type PointerTarget } from './worldPointer';
const target: PointerTarget = {
  interactableId: 'a',
  visualBounds: { x: 0, y: 0, width: 20, height: 20 },
  depth: 1,
  anchor: { u: 1, v: 1 },
  radiusPx: 80,
};
it('picks highest visible depth with stable ID ties', () => {
  expect(
    pickWorldTarget({ x: 5, y: 5 }, [target, { ...target, interactableId: 'b', depth: 2 }], [])
      ?.interactableId,
  ).toBe('b');
  expect(
    pickWorldTarget({ x: 5, y: 5 }, [{ ...target, interactableId: 'b' }, target], [])
      ?.interactableId,
  ).toBe('a');
});
it('cannot select through an opaque occluder but permits faded walls', () => {
  const wall = { bounds: target.visualBounds, depth: 2, opaque: true };
  expect(pickWorldTarget({ x: 5, y: 5 }, [target], [wall])).toBeNull();
  expect(pickWorldTarget({ x: 5, y: 5 }, [target], [{ ...wall, opaque: false }])).toEqual(target);
});
it('inverse projects camera world coordinates without applying scroll twice', () => {
  expect(
    pointerToLogical(
      { x: 192, y: 128 },
      { type: 'dimetric-2:1', originX: 0, originY: 0, tileWidth: 128, tileHeight: 64 },
    ),
  ).toEqual({ u: 3.5, v: 0.5 });
});
