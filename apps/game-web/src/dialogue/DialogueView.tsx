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
    textRef.current?.focus();
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
          <p ref={textRef} tabIndex={-1} lang="en" className="dialogue-text">
            {node.text}
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
              </button>
            ))}
          </div>
        </div>
      </PaperPanel>
    </div>
  );
}
