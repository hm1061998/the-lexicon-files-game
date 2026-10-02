import { useEffect, useRef, type RefObject } from 'react';
import { InkButton, ModalSheet, Stamp } from '@lexicon/ui';
import type {
  CaseBriefingDefinition,
  TranslationMode,
  UiStrings,
  VocabularyEntry,
} from '@lexicon/shared-types';
import { VocabularyText } from '../vocabulary/VocabularyText';
import { usePaperCue } from '../investigation/pagination/PaperCueContext';
import { getFocusTrapTarget } from '../pause/focusTrap';
import './briefing.css';

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function BriefingMemo({
  caseId,
  briefing,
  strings,
  vocabulary,
  translationMode,
  vocabularyTutorialSeen,
  onVocabularyTutorialSeen,
  onEncounter,
  onInspect,
  onRevealTranslation,
  onAccept,
  returnFocusRef,
}: {
  caseId: string;
  briefing: CaseBriefingDefinition;
  strings: UiStrings;
  vocabulary: readonly VocabularyEntry[];
  translationMode: TranslationMode;
  vocabularyTutorialSeen: boolean;
  onVocabularyTutorialSeen(): void;
  onEncounter(id: string, contextId: string): void;
  onInspect(id: string, contextId: string): void;
  onRevealTranslation(id: string, contextId: string): void;
  onAccept(): void;
  returnFocusRef?: RefObject<HTMLElement | null>;
}): JSX.Element {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const paperCue = usePaperCue();
  const cueRef = useRef(paperCue);
  cueRef.current = paperCue;

  useEffect(() => {
    cueRef.current();
  }, []);

  useEffect(() => {
    const returnTarget = returnFocusRef?.current ?? null;
    function handleTab(event: KeyboardEvent): void {
      const dialog = dialogRef.current;
      if (!dialog || event.key !== 'Tab') return;
      const focusables = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const target = getFocusTrapTarget(focusables, active, event.shiftKey);
      if (target) {
        event.preventDefault();
        target.focus();
      }
    }
    window.addEventListener('keydown', handleTab);
    return () => {
      window.removeEventListener('keydown', handleTab);
      if (returnTarget?.isConnected) returnTarget.focus();
    };
  }, [returnFocusRef]);

  return (
    <ModalSheet
      heading={strings.briefingTitle}
      stamp={<Stamp className="briefing-stamp">{strings.briefingStamp}</Stamp>}
      overlayClassName="briefing-overlay"
      className="briefing-memo"
      dialogRef={dialogRef}
    >
      <p className="briefing-from">{briefing.from}</p>
      {briefing.lines.map((line) => (
        <p key={line.id} className="briefing-line">
          <VocabularyText
            text={line.text}
            translationVi={line.translationVi}
            spans={line.vocabularySpans}
            contextId={`briefing:${caseId}:${line.id}:text`}
            catalogue={vocabulary}
            mode={translationMode}
            strings={strings}
            onEncounter={onEncounter}
            onInspect={onInspect}
            onRevealTranslation={onRevealTranslation}
            tutorialSeen={vocabularyTutorialSeen}
            onTutorialSeen={onVocabularyTutorialSeen}
          />
        </p>
      ))}
      <InkButton className="briefing-accept shell-button" autoFocus onClick={onAccept}>
        {strings.briefingAccept}
      </InkButton>
    </ModalSheet>
  );
}
