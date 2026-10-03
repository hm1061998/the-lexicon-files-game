import { describe, expect, it } from 'vitest';
import { createDefaultSettings, parseSettings } from './settingsSchema';

describe('settings schema', () => {
  const valid = createDefaultSettings({ prefersReducedMotion: false });
  it('accepts a valid record', () => {
    expect(parseSettings(valid)).toEqual(valid);
  });
  it('defaults', () => {
    expect(createDefaultSettings({ prefersReducedMotion: true })).toEqual({
      schemaVersion: 2,
      translationMode: 'Learning',
      volume: 80,
      subtitles: 'auto',
      reducedMotion: true,
      textSpeed: 'normal',
      uiSounds: true,
    });
  });
  it.each([
    ['volume 101', { volume: 101 }],
    ['volume -1', { volume: -1 }],
    ['volume 80.5', { volume: 80.5 }],
    ['volume string', { volume: '80' }],
    ['subtitles always', { subtitles: 'always' }],
    ['mode Expert', { translationMode: 'Expert' }],
    ['extra field', { extra: 1 }],
    ['schemaVersion 3', { schemaVersion: 3 }],
    ['textSpeed slow', { textSpeed: 'slow' }],
    ['uiSounds string', { uiSounds: 'yes' }],
  ])('rejects %s', (_name, patch) => {
    expect(() => parseSettings({ ...valid, ...patch })).toThrow();
  });

  it('upgrades a valid v1 record to v2 with the new defaults', () => {
    const v1 = {
      schemaVersion: 1,
      translationMode: 'Beginner',
      volume: 35,
      subtitles: 'on',
      reducedMotion: true,
    };
    expect(parseSettings(v1)).toEqual({
      ...v1,
      schemaVersion: 2,
      textSpeed: 'normal',
      uiSounds: true,
    });
  });

  it('keeps every v2 choice', () => {
    for (const textSpeed of ['instant', 'normal', 'fast'] as const) {
      expect(parseSettings({ ...valid, textSpeed, uiSounds: false })).toMatchObject({
        textSpeed,
        uiSounds: false,
      });
    }
  });

  it('rejects a v1 record carrying v2 fields', () => {
    expect(() => parseSettings({ ...valid, schemaVersion: 1 })).toThrow();
  });
});
