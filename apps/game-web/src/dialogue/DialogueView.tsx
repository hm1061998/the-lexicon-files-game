import { useEffect, useId, useRef } from 'react';
import { PaperPanel } from '@lexicon/ui';
import type {
  DialogueAction,
  DialogueChoice,
  DialogueNode,
  DialogueSession,
  UiStrings,
} from '@lexicon/shared-types';
import { getFocusTrapTarget } from '../pause/focusTrap';
import './dialogue.css';
import { VocabularyText } from '../vocabulary/VocabularyText';
import { DialogueVoiceControls } from './DialogueVoiceControls';
const FOCUSABLE =
  'button:not(:disabled), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
export type DialogueViewProps = {
  speakerName: string;
  speakerRole: string;
  node: DialogueNode;
  choices: readonly DialogueChoice[];
  session: DialogueSession;
  strings: UiStrings;
  error: string | null;
  onChoose(action: DialogueAction): void;
  onClose(): void;
  returnFocusRef: { readonly current: HTMLElement | null };
  vocabulary?: import('@lexicon/shared-types').CaseDefinition['vocabulary'];
  translationMode?: import('@lexicon/shared-types').TranslationMode;
  onEncounter?(vocabularyId: string, contextId: string): void;
  onInspect?(vocabularyId: string, contextId: string): void;
  onRevealTranslation?(vocabularyId: string, contextId: string): void;
  vocabularyTutorialSeen?: boolean;
  onVocabularyTutorialSeen?(): void;
};
export function DialogueView({
  speakerName,
  speakerRole,
  node,
  choices,
  session,
  strings,
  error,
  onChoose,
  onClose,
  returnFocusRef,
  vocabulary = [],
  translationMode = 'Learning',
  onEncounter = () => undefined,
  onInspect = () => undefined,
  onRevealTranslation = () => undefined,
  vocabularyTutorialSeen = true,
  onVocabularyTutorialSeen,
}: DialogueViewProps): JSX.Element {
  const title = useId(),
    dialogRef = useRef<HTMLDivElement>(null),
    textRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const fallbackFocus = returnFocusRef.current;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    function trap(event: KeyboardEvent) {
      if (event.key !== 'Tab') return;
      const focusables = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
      );
      const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const target = getFocusTrapTarget(focusables, active, event.shiftKey);
      if (target) {
        event.preventDefault();
        target.focus();
      }
    }
    window.addEventListener('keydown', trap);
    return () => {
      window.removeEventListener('keydown', trap);
      if (previous?.isConnected && previous !== document.body) previous.focus();
      else if (fallbackFocus?.isConnected) fallbackFocus.focus();
    };
  }, [returnFocusRef]);
  useEffect(() => {
    textRef.current?.focus({ preventScroll: true });
  }, [session.nodeId, session.revision]);
  return (
    <div className="dialogue-overlay">
      <PaperPanel as="div" className="dialogue-panel">
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={title}>
          <div className="dialogue-header">
            <div>
              <p className="dialogue-label">{strings.dialogue}</p>
              <h2 id={title}>{speakerName}</h2>
              <p className="dialogue-role">{speakerRole}</p>
            </div>
            <button type="button" onClick={onClose}>
              {strings.close}
            </button>
          </div>
          <div className="dialogue-tools">
            <DialogueVoiceControls audio={node.audio} strings={strings} />
          </div>
          <p ref={textRef} tabIndex={-1} lang="en" className="dialogue-text">
            <VocabularyText
              text={node.text}
              translationVi={node.translationVi}
              spans={node.vocabularySpans}
              contextId={`dialogue:${session.treeId}:${node.id}:text`}
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
          {error && (
            <p role="alert">
              {strings.dialogueError} {error}
            </p>
          )}
          <div className="dialogue-choices">
            {choices.map((choice) => (
              <button
                type="button"
                key={choice.id}
                onClick={(event) => {
                  // A replacement choice can occupy the same spot during a double click.
                  // Keyboard activation has detail 0 and remains available immediately.
                  if (event.detail > 1) return;
                  onChoose({
                    nodeId: session.nodeId,
                    revision: session.revision,
                    choiceId: choice.id,
                  });
                }}
              >
                {choice.text}
                {translationMode === 'Beginner' && choice.translationVi && (
                  <small className="dialogue-choice-translation">{choice.translationVi}</small>
                )}
              </button>
            ))}
          </div>
        </div>
      </PaperPanel>
    </div>
  );
}
