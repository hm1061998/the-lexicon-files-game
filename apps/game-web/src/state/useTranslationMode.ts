import { useCallback } from 'react';
import type { TranslationMode } from '@lexicon/shared-types';
import { useLearningStore } from './LearningStoreContext';
import { useSettingsStore } from './SettingsStoreContext';

/** Translation mode lives in settings; changing it also closes any open word tooltip. */
export function useTranslationMode(): [TranslationMode, (mode: TranslationMode) => void] {
  const mode = useSettingsStore((s) => s.settings.translationMode);
  const setMode = useSettingsStore((s) => s.setTranslationMode);
  const setActiveWord = useLearningStore((s) => s.setActiveWord);
  const change = useCallback(
    (next: TranslationMode) => {
      setMode(next);
      setActiveWord(null);
    },
    [setMode, setActiveWord],
  );
  return [mode, change];
}
