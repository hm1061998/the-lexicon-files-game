import { useCallback, useEffect, useId, useRef } from 'react';
import type {
  DialogueAction,
  DialogueChoice,
  DialogueNode,
  DialogueSession,
  UiStrings,
} from '@lexicon/shared-types';
import { getFocusTrapTarget } from '../pause/focusTrap';
import type { TextSpeed } from '../persistence/settingsSchema';
import { VocabularyText } from '../vocabulary/VocabularyText';
import { DialogueBand } from './DialogueBand';
import { dialogueKeyAction } from './dialogueKeys';
import { useTextReveal } from './useTextReveal';
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
  /** Typing speed of the line; `instant` (the default here) shows it whole. */
  textSpeed?: TextSpeed;
  reducedMotion?: boolean;
  portraitSrc?: string | undefined;
  /** Statements already recorded from this person, shown as the handwritten note. */
  notes?: readonly string[];
  /** Another layer (the conversation log) owns the keyboard for now. */
  keysDisabled?: boolean;
  /** Whether a choice was already asked (dims it; it stays selectable). */
  isChoiceSeen?(choice: DialogueChoice): boolean;
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
  textSpeed = 'instant',
  reducedMotion = false,
  portraitSrc,
  notes = [],
  isChoiceSeen = () => false,
  keysDisabled = false,
}: DialogueViewProps): JSX.Element {
  const title = useId(),
    dialogRef = useRef<HTMLDivElement>(null),
    textRef = useRef<HTMLParagraphElement>(null);
  const { shown, done, finish } = useTextReveal(node.text, textSpeed);

  // One handler for every way of choosing, so the revision guard and the double-click guard hold.
  const choose = useCallback(
    (choiceId: string) =>
      onChoose({ nodeId: session.nodeId, revision: session.revision, choiceId }),
    [onChoose, session.nodeId, session.revision],
  );
  const latest = useRef({ done, choices, choose, finish, keysDisabled });
  latest.current = { done, choices, choose, finish, keysDisabled };

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const { done: lineDone, choices: list, choose: pick, finish: complete } = latest.current;
      if (latest.current.keysDisabled) return;
      const action = dialogueKeyAction(event, { done: lineDone, choiceCount: list.length });
      if (!action) return;
      event.preventDefault();
      if (action.type === 'finish') complete();
      else pick(list[action.index]!.id);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const fallbackFocus = returnFocusRef.current;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    function trap(event: KeyboardEvent) {
      if (event.key !== 'Tab' || latest.current.keysDisabled) return;
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
    <DialogueBand
      speakerName={speakerName}
      speakerRole={speakerRole}
      portraitSrc={portraitSrc}
      strings={strings}
      node={node}
      shown={shown}
      done={done}
      choices={choices.map((choice) => ({ choice, seen: isChoiceSeen(choice) }))}
      notes={notes}
      translationMode={translationMode}
      reducedMotion={reducedMotion}
      titleId={title}
      error={error}
      textRef={textRef}
      dialogRef={dialogRef}
      renderText={() =>
        done ? (
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
        ) : (
          node.text.slice(0, shown)
        )
      }
      onChoose={(choiceId, event) => {
        // A replacement choice can occupy the same spot during a double click.
        // Keyboard activation has detail 0 and remains available immediately.
        if (event.detail > 1) return;
        choose(choiceId);
      }}
      onClose={onClose}
      onAdvance={() => {
        if (!latest.current.done) latest.current.finish();
      }}
    />
  );
}
