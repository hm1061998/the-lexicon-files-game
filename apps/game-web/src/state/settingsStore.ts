import { createStore, type StoreApi } from 'zustand/vanilla';
import type { TranslationMode } from '@lexicon/shared-types';
import type { SettingsV2, SubtitlePreference, TextSpeed } from '../persistence/settingsSchema';

export type SettingsStoreState = {
  settings: SettingsV2;
  setTranslationMode(mode: TranslationMode): void;
  setVolume(volume: number): void;
  setSubtitles(subtitles: SubtitlePreference): void;
  setReducedMotion(reducedMotion: boolean): void;
  setTextSpeed(textSpeed: TextSpeed): void;
  setUiSounds(uiSounds: boolean): void;
};
export type SettingsStore = StoreApi<SettingsStoreState>;

export function createSettingsStore(initial: SettingsV2): SettingsStore {
  return createStore<SettingsStoreState>((set) => ({
    settings: initial,
    setTranslationMode: (translationMode) =>
      set((s) => ({ settings: { ...s.settings, translationMode } })),
    setVolume: (volume) =>
      set((s) => ({
        settings: {
          ...s.settings,
          volume: Math.min(100, Math.max(0, Math.round(Number.isFinite(volume) ? volume : 0))),
        },
      })),
    setSubtitles: (subtitles) => set((s) => ({ settings: { ...s.settings, subtitles } })),
    setReducedMotion: (reducedMotion) =>
      set((s) => ({ settings: { ...s.settings, reducedMotion } })),
    setTextSpeed: (textSpeed) => set((s) => ({ settings: { ...s.settings, textSpeed } })),
    setUiSounds: (uiSounds) => set((s) => ({ settings: { ...s.settings, uiSounds } })),
  }));
}
