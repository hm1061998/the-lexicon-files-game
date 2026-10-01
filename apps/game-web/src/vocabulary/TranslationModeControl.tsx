import type { TranslationMode, UiStrings } from '@lexicon/shared-types';
import './vocabulary.css';

const MODES: readonly { value: TranslationMode; label: keyof UiStrings }[] = [
  { value: 'Beginner', label: 'vocabularyModeBeginner' },
  { value: 'Learning', label: 'vocabularyModeLearning' },
  { value: 'Immersion', label: 'vocabularyModeImmersion' },
];

export function TranslationModeControl({
  mode,
  strings,
  onChange,
}: {
  mode: TranslationMode;
  strings: UiStrings;
  onChange(mode: TranslationMode): void;
}): JSX.Element {
  return (
    <span className="translation-mode-control">
      <span className="translation-mode-label">{strings.vocabularyMode}</span>
      <span className="translation-mode-options" role="group" aria-label={strings.vocabularyMode}>
        {MODES.map(({ value, label }) => (
          <button
            type="button"
            key={value}
            aria-pressed={mode === value}
            onClick={() => onChange(value)}
          >
            {strings[label]}
          </button>
        ))}
      </span>
    </span>
  );
}
