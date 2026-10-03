import { describe, expect, it } from 'vitest';
import { recorderKeyAction } from './useRecorderShortcuts';

const key = (k: string, extra: Record<string, unknown> = {}) => ({
  key: k,
  repeat: false,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  target: { tagName: 'BODY' },
  ...extra,
});

describe('recorderKeyAction', () => {
  it('maps Space, R, H and T to the four keys of the recorder', () => {
    expect(recorderKeyAction(key(' '), 3)).toEqual({ type: 'playPause' });
    expect(recorderKeyAction(key('r'), 3)).toEqual({ type: 'restart' });
    expect(recorderKeyAction(key('R'), 3)).toEqual({ type: 'restart' });
    expect(recorderKeyAction(key('h'), 3)).toEqual({ type: 'hint' });
    expect(recorderKeyAction(key('t'), 3)).toEqual({ type: 'transcript' });
  });

  it('maps the number keys to the answers that exist', () => {
    expect(recorderKeyAction(key('1'), 3)).toEqual({ type: 'answer', index: 0 });
    expect(recorderKeyAction(key('3'), 3)).toEqual({ type: 'answer', index: 2 });
    expect(recorderKeyAction(key('4'), 3)).toBeNull();
    expect(recorderKeyAction(key('0'), 3)).toBeNull();
  });

  it('ignores a held key, modifier chords and other keys', () => {
    expect(recorderKeyAction(key(' ', { repeat: true }), 3)).toBeNull();
    expect(recorderKeyAction(key('r', { ctrlKey: true }), 3)).toBeNull();
    expect(recorderKeyAction(key('x'), 3)).toBeNull();
  });

  it('leaves every key alone while a text field has focus', () => {
    for (const k of [' ', 'r', 'h', 't', '1']) {
      expect(recorderKeyAction(key(k, { target: { tagName: 'TEXTAREA' } }), 3)).toBeNull();
    }
  });

  it('leaves Space to a focused control so it is never activated twice', () => {
    for (const tagName of ['BUTTON', 'A', 'SELECT']) {
      expect(recorderKeyAction(key(' ', { target: { tagName } }), 3)).toBeNull();
    }
    expect(recorderKeyAction(key('r', { target: { tagName: 'BUTTON' } }), 3)).toEqual({
      type: 'restart',
    });
  });
});
