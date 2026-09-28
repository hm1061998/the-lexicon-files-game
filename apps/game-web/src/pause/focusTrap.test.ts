import { describe, expect, it } from 'vitest';
import { getFocusTrapTarget } from './focusTrap';

describe('getFocusTrapTarget', () => {
  const items = ['a', 'b', 'c'];

  it('wraps Tab at the last element to the first', () => {
    expect(getFocusTrapTarget(items, 'c', false)).toBe('a');
  });

  it('wraps Shift+Tab at the first element to the last', () => {
    expect(getFocusTrapTarget(items, 'a', true)).toBe('c');
  });

  it('returns the first element when active is outside the list', () => {
    expect(getFocusTrapTarget(items, 'z', false)).toBe('a');
  });

  it('returns null for an empty list', () => {
    expect(getFocusTrapTarget([], 'a', false)).toBeNull();
  });

  it('returns null when active is in the middle (no wrap needed)', () => {
    expect(getFocusTrapTarget(items, 'b', false)).toBeNull();
  });
});
