import type { TranslationMode, UiStrings } from '@lexicon/shared-types';
import { ShellCover } from './ShellCover';

export function SupportPicker({
  strings,
  caseTitle,
  onChoose,
}: {
  strings: UiStrings;
  caseTitle?: string;
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
    <ShellCover
      strings={strings}
      {...(caseTitle ? { caseTitle } : {})}
      title={strings.supportTitle}
      tagline={false}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={strings.supportTitle}
        className="support-notes"
      >
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
        <button type="button" className="title-link" onClick={() => onChoose('Learning')}>
          {strings.supportUseDefault}
        </button>
      </div>
    </ShellCover>
  );
}
