import { useEffect, useId, useRef } from 'react';
import { PaperPanel } from '@lexicon/ui';
import type { EvidenceDefinition, UiStrings } from '@lexicon/shared-types';
import { getFocusTrapTarget } from '../pause/focusTrap';
import './evidence.css';
import { VocabularyText } from '../vocabulary/VocabularyText';
import { ListeningTaskPanel } from './ListeningTaskPanel';
import type { ListeningAnswerResult, ListeningTaskDefinition } from '@lexicon/shared-types';
import type { LearningAction } from '@lexicon/shared-types';

type ListeningEvent = Extract<LearningAction, { type: 'recordListeningEvent' }>['event'];

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function EvidenceModal({
  evidence,
  strings,
  onClose,
  vocabulary = [],
  translationMode = 'Learning',
  subtitles = 'auto',
  onEncounter = () => undefined,
  onInspect = () => undefined,
  onRevealTranslation = () => undefined,
  onTranslationModeChange,
  vocabularyTutorialSeen = true,
  onVocabularyTutorialSeen,
  listeningTask,
  listeningCompleted = false,
  onListeningAnswer,
  onListeningTelemetry,
}: {
  evidence: EvidenceDefinition;
  strings: UiStrings;
  onClose(): void;
  vocabulary?: import('@lexicon/shared-types').CaseDefinition['vocabulary'];
  translationMode?: import('@lexicon/shared-types').TranslationMode;
  subtitles?: import('../persistence/settingsSchema').SubtitlePreference;
  onEncounter?(vocabularyId: string, contextId: string): void;
  onInspect?(vocabularyId: string, contextId: string): void;
  onRevealTranslation?(vocabularyId: string, contextId: string): void;
  onTranslationModeChange?(mode: import('@lexicon/shared-types').TranslationMode): void;
  vocabularyTutorialSeen?: boolean;
  onVocabularyTutorialSeen?(): void;
  listeningTask?: ListeningTaskDefinition;
  listeningCompleted?: boolean;
  onListeningAnswer?(taskId: string, optionId: string): ListeningAnswerResult;
  onListeningTelemetry?(event: ListeningEvent, elapsedMs?: number): void;
}): JSX.Element {
  const headingId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    const first = dialog?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    first?.focus();

    function handleTab(event: KeyboardEvent): void {
      const currentDialog = dialogRef.current;
      if (!currentDialog || event.key !== 'Tab') return;
      const focusables = Array.from(
        currentDialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
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
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  return (
    <div className="evidence-overlay">
      <PaperPanel as="div" className="evidence-modal">
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={headingId}>
          <div className="evidence-modal-header">
            <h2 id={headingId}>{evidence.name}</h2>
            <button type="button" autoFocus aria-label={strings.close} onClick={onClose}>
              {strings.close}
            </button>
          </div>
          <p className="evidence-category">{strings.evidence}</p>
          <p>
            <VocabularyText
              text={evidence.description}
              translationVi={evidence.descriptionVi}
              spans={evidence.vocabularySpans}
              contextId={`evidence:${evidence.id}:description`}
              catalogue={vocabulary}
              mode={translationMode}
              strings={strings}
              onEncounter={onEncounter}
              onInspect={onInspect}
              onRevealTranslation={onRevealTranslation}
              onModeChange={onTranslationModeChange}
              tutorialSeen={vocabularyTutorialSeen}
              onTutorialSeen={onVocabularyTutorialSeen}
            />
          </p>
          {evidence.category === 'audio' && listeningTask && onListeningAnswer && (
            <ListeningTaskPanel
              task={listeningTask}
              mode={translationMode}
              subtitles={subtitles}
              completed={listeningCompleted}
              onAnswer={(optionId) => onListeningAnswer(listeningTask.id, optionId)}
              onTelemetry={(event, elapsedMs) => onListeningTelemetry?.(event, elapsedMs)}
              strings={strings}
            />
          )}
        </div>
      </PaperPanel>
    </div>
  );
}
