import { describe, expect, it } from 'vitest';
import { mergeMovementKeys } from './input';

it('merges paired keys without increasing force and cancels opposite directions', () => {
  const up = { up: true, down: false, left: false, right: false };
  expect(mergeMovementKeys(up, up)).toEqual(up);
  expect(
    resolveInputVector(mergeMovementKeys(up, { ...up, up: false, down: true }), false),
  ).toEqual({ x: 0, y: 0 });
});
import { isTypingTarget, resolveInputVector } from './input';

describe('resolveInputVector', () => {
  it('returns zero vector when no keys are pressed', () => {
    expect(
      resolveInputVector({ up: false, down: false, left: false, right: false }, false),
    ).toEqual({ x: 0, y: 0 });
  });

  it('returns {1,0} when right is pressed', () => {
    expect(resolveInputVector({ up: false, down: false, left: false, right: true }, false)).toEqual(
      { x: 1, y: 0 },
    );
  });

  it('returns {0,-1} when up is pressed', () => {
    expect(resolveInputVector({ up: true, down: false, left: false, right: false }, false)).toEqual(
      { x: 0, y: -1 },
    );
  });

  it('normalizes diagonal movement to unit length', () => {
    const result = resolveInputVector({ up: true, down: false, left: false, right: true }, false);
    expect(result.x).toBeCloseTo(0.7071, 4);
    expect(result.y).toBeCloseTo(-0.7071, 4);
    expect(Math.hypot(result.x, result.y)).toBeCloseTo(1, 10);
  });

  it('cancels opposite keys to zero vector', () => {
    expect(resolveInputVector({ up: false, down: false, left: true, right: true }, false)).toEqual({
      x: 0,
      y: 0,
    });
  });

  it('returns zero vector when typing regardless of keys', () => {
    expect(resolveInputVector({ up: false, down: false, left: false, right: true }, true)).toEqual({
      x: 0,
      y: 0,
    });
  });
});

describe('isTypingTarget', () => {
  it('returns false for null', () => {
    expect(isTypingTarget(null)).toBe(false);
  });

  it.each(['text', 'search', 'email', 'url', 'tel', 'password', 'number', '', undefined])(
    'returns true for INPUT type %s',
    (type) => {
      expect(isTypingTarget({ tagName: 'INPUT', type } as unknown as Element)).toBe(true);
    },
  );

  it.each(['range', 'checkbox', 'radio', 'button', 'submit'])(
    'returns false for INPUT type %s',
    (type) => {
      expect(isTypingTarget({ tagName: 'INPUT', type } as unknown as Element)).toBe(false);
    },
  );

  it('returns true for TEXTAREA element', () => {
    expect(isTypingTarget({ tagName: 'TEXTAREA' } as unknown as Element)).toBe(true);
  });

  it('returns true for contentEditable element', () => {
    expect(isTypingTarget({ tagName: 'DIV', isContentEditable: true } as unknown as Element)).toBe(
      true,
    );
  });

  it('returns false for a plain non-editable element', () => {
    expect(isTypingTarget({ tagName: 'DIV', isContentEditable: false } as unknown as Element)).toBe(
      false,
    );
  });
});
