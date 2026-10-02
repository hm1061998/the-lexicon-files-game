import type { TranslationMode, UiStrings } from '@lexicon/shared-types';
import './title.css';

export function SupportPicker({
  strings,
  onChoose,
}: {
  strings: UiStrings;
  onChoose: (mode: TranslationMode) => void;
}): JSX.Element {
  const options: readonly { mode: TranslationMode; label: string; hint: string }[] = [
    { mode: 'Beginner', label: strings.vocabularyModeBeginner, hint: strings.supportBeginnerHint },
    { mode: 'Learning', label: strings.vocabularyModeLearning, hint: strings.supportLearningHint },
    {
      mode: 'Immersion',
      label: strings.vocabularyModeImmersion,
      hint: strings.supportImmersionHint,
    },
  ];
  return (
    <main className="title-screen">
      <section
        className="title-card"
        role="dialog"
        aria-modal="true"
        aria-label={strings.supportTitle}
      >
        <h2>{strings.supportTitle}</h2>
        <div className="title-actions support-options">
          {options.map(({ mode, label, hint }) => (
            <button
              key={mode}
              type="button"
              className="support-option"
              autoFocus={mode === 'Learning'}
              onClick={() => onChoose(mode)}
            >
              <strong>{label}</strong>
              <span>{hint}</span>
            </button>
          ))}
        </div>
        <button type="button" className="title-link" onClick={() => onChoose('Learning')}>
          {strings.supportUseDefault}
        </button>
      </section>
    </main>
  );
}
