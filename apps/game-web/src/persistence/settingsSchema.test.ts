import { describe, expect, it } from 'vitest';
import { createDefaultSettings, parseSettings } from './settingsSchema';

describe('settings schema', () => {
  const valid = createDefaultSettings({ prefersReducedMotion: false });
  it('accepts a valid record', () => {
    expect(parseSettings(valid)).toEqual(valid);
  });
  it('defaults', () => {
    expect(createDefaultSettings({ prefersReducedMotion: true })).toEqual({
      schemaVersion: 1,
      translationMode: 'Learning',
      volume: 80,
      subtitles: 'auto',
      reducedMotion: true,
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
    ['schemaVersion 2', { schemaVersion: 2 }],
  ])('rejects %s', (_name, patch) => {
    expect(() => parseSettings({ ...valid, ...patch })).toThrow();
  });
});
