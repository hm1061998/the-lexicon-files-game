import { createStore, type StoreApi } from 'zustand/vanilla';
import type { TranslationMode } from '@lexicon/shared-types';
import type { SettingsV1, SubtitlePreference } from '../persistence/settingsSchema';

export type SettingsStoreState = {
  settings: SettingsV1;
  setTranslationMode(mode: TranslationMode): void;
  setVolume(volume: number): void;
  setSubtitles(subtitles: SubtitlePreference): void;
  setReducedMotion(reducedMotion: boolean): void;
};
export type SettingsStore = StoreApi<SettingsStoreState>;

export function createSettingsStore(initial: SettingsV1): SettingsStore {
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
  }));
}
