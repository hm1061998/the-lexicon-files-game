import { useId } from 'react';
import type { TranslationMode, UiStrings } from '@lexicon/shared-types';
import { useSettingsStore } from '../state/SettingsStoreContext';
import { useTranslationMode } from '../state/useTranslationMode';
import type { SubtitlePreference } from '../persistence/settingsSchema';

export function SettingsFields({ strings }: { strings: UiStrings }): JSX.Element {
  const [translationMode, onTranslationModeChange] = useTranslationMode();
  const volume = useSettingsStore((s) => s.settings.volume);
  const subtitles = useSettingsStore((s) => s.settings.subtitles);
  const reducedMotion = useSettingsStore((s) => s.settings.reducedMotion);
  const setVolume = useSettingsStore((s) => s.setVolume);
  const setSubtitles = useSettingsStore((s) => s.setSubtitles);
  const setReducedMotion = useSettingsStore((s) => s.setReducedMotion);
  const headingId = useId();
  return (
    <>
      <label>
        {strings.vocabularyMode}
        <select
          value={translationMode}
          onChange={(event) => onTranslationModeChange(event.target.value as TranslationMode)}
        >
          <option value="Beginner">{strings.vocabularyModeBeginner}</option>
          <option value="Learning">{strings.vocabularyModeLearning}</option>
          <option value="Immersion">{strings.vocabularyModeImmersion}</option>
        </select>
      </label>
      <div>
        <span id={`${headingId}-volume`}>{strings.settingsVolume}</span>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          aria-labelledby={`${headingId}-volume`}
          value={volume}
          onChange={(event) => setVolume(Number(event.target.value))}
        />
        <output>{volume}%</output>
      </div>
      <div>
        <span id={`${headingId}-subtitles`}>{strings.settingsSubtitles}</span>
        <select
          aria-labelledby={`${headingId}-subtitles`}
          value={subtitles}
          onChange={(event) => setSubtitles(event.target.value as SubtitlePreference)}
        >
          <option value="auto">{strings.settingsSubtitlesAuto}</option>
          <option value="on">{strings.settingsSubtitlesOn}</option>
          <option value="off">{strings.settingsSubtitlesOff}</option>
        </select>
      </div>
      <label>
        <input
          type="checkbox"
          checked={reducedMotion}
          onChange={(event) => setReducedMotion(event.target.checked)}
        />
        {strings.settingsReducedMotion}
      </label>
    </>
  );
}
