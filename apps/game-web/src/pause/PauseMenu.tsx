import { useEffect, useId, useRef } from 'react';
import { PaperPanel } from '@lexicon/ui';
import type { TranslationMode, UiStrings } from '@lexicon/shared-types';
import { getFocusTrapTarget } from './focusTrap';
import './pause.css';

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function PauseMenu({
  strings,
  onResume,
  translationMode = 'Learning',
  onTranslationModeChange = () => undefined,
}: {
  strings: UiStrings;
  onResume: () => void;
  translationMode?: TranslationMode;
  onTranslationModeChange?(mode: TranslationMode): void;
}): JSX.Element {
  const headingId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      const dialog = dialogRef.current;
      if (!dialog || event.key !== 'Tab') {
        return;
      }
      const focusables = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const target = getFocusTrapTarget(focusables, active, event.shiftKey);
      if (target) {
        event.preventDefault();
        target.focus();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="pause-menu-overlay">
      <PaperPanel as="div" className="pause-menu">
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={headingId}>
          <h2 id={headingId}>{strings.paused}</h2>
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
          <button type="button" autoFocus onClick={onResume}>
            {strings.resume}
          </button>
        </div>
      </PaperPanel>
    </div>
  );
}
