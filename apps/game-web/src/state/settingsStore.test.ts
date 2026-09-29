import { describe, expect, it } from 'vitest';
import { createDefaultSettings } from '../persistence/settingsSchema';
import { createSettingsStore } from './settingsStore';

describe('settings store', () => {
  it('starts from initial settings', () => {
    const initial = createDefaultSettings({ prefersReducedMotion: false });
    const store = createSettingsStore(initial);
    expect(store.getState().settings).toEqual(initial);
  });
  it('clamps and rounds volume', () => {
    const store = createSettingsStore(createDefaultSettings({ prefersReducedMotion: false }));
    store.getState().setVolume(120);
    expect(store.getState().settings.volume).toBe(100);
    store.getState().setVolume(33.4);
    expect(store.getState().settings.volume).toBe(33);
    store.getState().setVolume(-5);
    expect(store.getState().settings.volume).toBe(0);
  });
  it('updates other settings', () => {
    const store = createSettingsStore(createDefaultSettings({ prefersReducedMotion: false }));
    store.getState().setTranslationMode('Immersion');
    store.getState().setSubtitles('off');
    store.getState().setReducedMotion(true);
    expect(store.getState().settings).toMatchObject({
      translationMode: 'Immersion',
      subtitles: 'off',
      reducedMotion: true,
    });
  });
});
