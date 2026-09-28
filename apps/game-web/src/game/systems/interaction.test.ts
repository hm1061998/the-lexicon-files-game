import { describe, expect, it } from 'vitest';
import { findNearestInteractable, type InteractableArea } from './interaction';

describe('findNearestInteractable', () => {
  it('returns null when there are no areas', () => {
    expect(findNearestInteractable({ x: 0, y: 0 }, [])).toBeNull();
  });

  it('returns null when position is outside every area radius', () => {
    const areas: InteractableArea[] = [{ id: 'a', x: 100, y: 100, radius: 10 }];
    expect(findNearestInteractable({ x: 0, y: 0 }, areas)).toBeNull();
  });

  it('returns the area when distance exactly equals the radius', () => {
    const areas: InteractableArea[] = [{ id: 'a', x: 10, y: 0, radius: 10 }];
    expect(findNearestInteractable({ x: 0, y: 0 }, areas)).toEqual(areas[0]);
  });

  it('returns the closer of two overlapping areas', () => {
    const far: InteractableArea = { id: 'far', x: 8, y: 0, radius: 20 };
    const near: InteractableArea = { id: 'near', x: 2, y: 0, radius: 20 };
    expect(findNearestInteractable({ x: 0, y: 0 }, [far, near])).toEqual(near);
  });

  it('breaks ties by lower id via localeCompare', () => {
    const b: InteractableArea = { id: 'b', x: 5, y: 0, radius: 20 };
    const a: InteractableArea = { id: 'a', x: -5, y: 0, radius: 20 };
    expect(findNearestInteractable({ x: 0, y: 0 }, [b, a])).toEqual(a);
  });
});
