import { describe, expect, it } from 'vitest';
import { shouldHandleShortcut } from './shouldHandleShortcut';

const body = { tagName: 'BODY' } as unknown as Element;
const input = { tagName: 'INPUT' } as unknown as Element;

describe('shouldHandleShortcut', () => {
  it('handles the key when focus is on the body', () => {
    expect(shouldHandleShortcut({ key: 'Escape', target: body }, 'Escape')).toBe(true);
  });

  it('ignores the key while typing in an input', () => {
    expect(shouldHandleShortcut({ key: 'Escape', target: input }, 'Escape')).toBe(false);
  });

  it('ignores other keys', () => {
    expect(shouldHandleShortcut({ key: 'e', target: body }, 'Escape')).toBe(false);
  });
});
