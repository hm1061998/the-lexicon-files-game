import { describe, expect, it } from 'vitest';
import { dialogueKeyAction } from './dialogueKeys';

const key = (k: string, extra: Record<string, unknown> = {}) => ({
  key: k,
  repeat: false,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  target: { tagName: 'BODY' },
  ...extra,
});

describe('dialogueKeyAction', () => {
  it('finishes a line that is still being typed', () => {
    for (const k of [' ', 'Enter', 'e', 'E']) {
      expect(dialogueKeyAction(key(k), { done: false, choiceCount: 3 })).toEqual({
        type: 'finish',
      });
    }
  });

  it('chooses the only choice of a finished line, and does nothing when there are several', () => {
    expect(dialogueKeyAction(key(' '), { done: true, choiceCount: 1 })).toEqual({
      type: 'choose',
      index: 0,
    });
    expect(dialogueKeyAction(key(' '), { done: true, choiceCount: 3 })).toBeNull();
    expect(dialogueKeyAction(key('Enter'), { done: true, choiceCount: 0 })).toBeNull();
  });

  it('chooses by number only after the line is shown and within the choice count', () => {
    expect(dialogueKeyAction(key('2'), { done: true, choiceCount: 3 })).toEqual({
      type: 'choose',
      index: 1,
    });
    expect(dialogueKeyAction(key('4'), { done: true, choiceCount: 3 })).toBeNull();
    expect(dialogueKeyAction(key('1'), { done: false, choiceCount: 3 })).toBeNull();
    expect(dialogueKeyAction(key('0'), { done: true, choiceCount: 3 })).toBeNull();
  });

  it('ignores a held key, modifier chords and other keys', () => {
    const state = { done: false, choiceCount: 2 };
    expect(dialogueKeyAction(key(' ', { repeat: true }), state)).toBeNull();
    expect(dialogueKeyAction(key(' ', { ctrlKey: true }), state)).toBeNull();
    expect(dialogueKeyAction(key('x'), state)).toBeNull();
  });

  it('leaves keys alone while a control or a text field has focus', () => {
    const state = { done: true, choiceCount: 1 };
    for (const tagName of ['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT']) {
      expect(dialogueKeyAction(key(' ', { target: { tagName } }), state)).toBeNull();
    }
    expect(
      dialogueKeyAction(key('2', { target: { tagName: 'DIV', isContentEditable: true } }), {
        done: true,
        choiceCount: 3,
      }),
    ).toBeNull();
  });
});
