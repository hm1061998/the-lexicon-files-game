import { describe, expect, it } from 'vitest';
import { findNearestInteractable, findNearestIsoInteractable, type InteractableArea } from './interaction';
import type { IsoProjection } from '@lexicon/shared-types';

const projection: IsoProjection = {
  type: 'dimetric-2:1',
  originX: 0,
  originY: 0,
  tileWidth: 128,
  tileHeight: 64,
};

describe('findNearestInteractable', () => {
  it('returns null when there are no areas', () => {
    expect(findNearestInteractable({ x: 0, y: 0 }, [])).toBeNull();
  });

  it('returns null when position is outside every area radius', () => {
    const areas: InteractableArea[] = [{ id: 'a', x: 100, y: 100, radius: 10, prompt: 'p' }];
    expect(findNearestInteractable({ x: 0, y: 0 }, areas)).toBeNull();
  });

  it('returns the area when distance exactly equals the radius', () => {
    const areas: InteractableArea[] = [{ id: 'a', x: 10, y: 0, radius: 10, prompt: 'p' }];
    expect(findNearestInteractable({ x: 0, y: 0 }, areas)).toEqual(areas[0]);
  });

  it('returns the closer of two overlapping areas', () => {
    const far: InteractableArea = { id: 'far', x: 8, y: 0, radius: 20, prompt: 'p' };
    const near: InteractableArea = { id: 'near', x: 2, y: 0, radius: 20, prompt: 'p' };
    expect(findNearestInteractable({ x: 0, y: 0 }, [far, near])).toEqual(near);
  });

  it('breaks ties by lower id via localeCompare', () => {
    const b: InteractableArea = { id: 'b', x: 5, y: 0, radius: 20, prompt: 'p' };
    const a: InteractableArea = { id: 'a', x: -5, y: 0, radius: 20, prompt: 'p' };
    expect(findNearestInteractable({ x: 0, y: 0 }, [b, a])).toEqual(a);
  });
});

describe('findNearestIsoInteractable', () => {
  it('measures interaction radius between projected floor points in screen pixels', () => {
    const area = { id: 'note', u: 2, v: 1, radius: 72, prompt: 'Inspect' };
    expect(findNearestIsoInteractable({ u: 1, v: 1 }, [area], projection)).toEqual(area);
    expect(findNearestIsoInteractable({ u: 0, v: 1 }, [area], projection)).toBeNull();
  });

  it('uses asset id to break equal-distance ties deterministically', () => {
    const a = { id: 'a', u: 1, v: 0, radius: 100, prompt: 'A' };
    const b = { id: 'b', u: -1, v: 0, radius: 100, prompt: 'B' };
    expect(findNearestIsoInteractable({ u: 0, v: 0 }, [b, a], projection)).toEqual(a);
  });
});
