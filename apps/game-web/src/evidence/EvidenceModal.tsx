import { useEffect, useId, useRef, useState } from 'react';
import { InkButton, ModalSheet } from '@lexicon/ui';
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

export function nextImageFailureState(event: 'error', image: string | undefined): string | null {
  return event === 'error' ? (image ?? null) : null;
}

export function shouldShowEvidenceImage(
  image: string | undefined,
  failedImage: string | null,
): boolean {
  return image !== undefined && failedImage !== image;
}

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
  vocabularyTutorialSeen?: boolean;
  onVocabularyTutorialSeen?(): void;
  listeningTask?: ListeningTaskDefinition;
  listeningCompleted?: boolean;
  onListeningAnswer?(taskId: string, optionId: string): ListeningAnswerResult;
  onListeningTelemetry?(event: ListeningEvent, elapsedMs?: number): void;
}): JSX.Element {
  const headingId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const showImage = shouldShowEvidenceImage(evidence.image, failedImage);
  const hasListening = evidence.category === 'audio' && !!listeningTask && !!onListeningAnswer;
  // The recording is the point of an audio card, so it opens on the listening section.
  const [section, setSection] = useState<'evidence' | 'listening'>('listening');
  const showEvidence = !hasListening || section === 'evidence';

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
      ).filter((el) => !el.closest('[hidden]'));
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
    <ModalSheet
      heading={evidence.name}
      headingId={headingId}
      overlayClassName="evidence-overlay"
      className="evidence-modal"
      dialogRef={dialogRef}
    >
      <InkButton className="evidence-close" autoFocus aria-label={strings.close} onClick={onClose}>
        {strings.close}
      </InkButton>
      {hasListening && (
        <div className="evidence-tabs" role="group" aria-label={evidence.name}>
          <button
            type="button"
            className="evidence-tab"
            aria-pressed={section === 'listening'}
            onClick={() => setSection('listening')}
          >
            {strings.listeningTask}
          </button>
          <button
            type="button"
            className="evidence-tab"
            aria-pressed={section === 'evidence'}
            onClick={() => setSection('evidence')}
          >
            {strings.evidence}
          </button>
        </div>
      )}
      <div className="evidence-section" hidden={!showEvidence}>
        {showImage && (
          <span className="evidence-photo">
            <img
              className="evidence-art"
              src={evidence.image}
              alt=""
              onError={() => setFailedImage(nextImageFailureState('error', evidence.image))}
            />
          </span>
        )}
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
            tutorialSeen={vocabularyTutorialSeen}
            onTutorialSeen={onVocabularyTutorialSeen}
          />
        </p>
      </div>
      <div className="evidence-listening" hidden={hasListening && section !== 'listening'}>
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
    </ModalSheet>
  );
}
