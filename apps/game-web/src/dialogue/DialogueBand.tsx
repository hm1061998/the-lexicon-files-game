import type { CSSProperties, ReactNode, RefObject } from 'react';
import { InkButton } from '@lexicon/ui';
import type {
  DialogueChoice,
  DialogueNode,
  TranslationMode,
  UiStrings,
} from '@lexicon/shared-types';
import { DialogueVoiceControls } from './DialogueVoiceControls';
import { Portrait } from './Portrait';
import './dialogue.css';
import './dialogue-band.css';

export type BandChoice = { choice: DialogueChoice; seen: boolean };

/**
 * The interrogation band: a dark strip along the bottom with the speaker's portrait, the line
 * (typed out, read in full through a live region), numbered choices and the notes taken so far.
 * Purely presentational; DialogueView owns the focus, the keys and the reveal.
 */
export function DialogueBand({
  speakerName,
  speakerRole,
  portraitSrc,
  strings,
  node,
  done,
  choices,
  notes,
  translationMode,
  reducedMotion,
  titleId,
  error,
  textRef,
  dialogRef,
  renderText,
  onChoose,
  onClose,
  onAdvance,
}: {
  speakerName: string;
  speakerRole: string;
  portraitSrc?: string | undefined;
  strings: UiStrings;
  node: DialogueNode;
  /** `shown` is only needed by the caller's `renderText`; the band cares whether the line is complete. */
  shown?: number;
  done: boolean;
  choices: readonly BandChoice[];
  notes: readonly string[];
  translationMode: TranslationMode;
  reducedMotion: boolean;
  titleId: string;
  error: string | null;
  textRef: RefObject<HTMLParagraphElement>;
  dialogRef?: RefObject<HTMLDivElement>;
  renderText(): ReactNode;
  onChoose(choiceId: string, event: { detail: number }): void;
  onClose(): void;
  /** A click on the line area: while the line is still typing, finish it. */
  onAdvance?(): void;
}): JSX.Element {
  return (
    <div
      className={reducedMotion ? 'dialogue-overlay dialogue-overlay--still' : 'dialogue-overlay'}
    >
      <div className="dialogue-panel dialogue-band">
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <p className="dialogue-interrogating">
            {strings.dialogueInterrogating} · {speakerName}
          </p>
          <div className="dialogue-header">
            <Portrait npcName={speakerName} src={portraitSrc} reducedMotion={reducedMotion} />
            <div className="dialogue-speaker">
              <h2 id={titleId}>{speakerName}</h2>
              <p className="dialogue-role">{speakerRole}</p>
              <div className="dialogue-tools">
                <DialogueVoiceControls audio={node.audio} strings={strings} />
              </div>
            </div>
            <InkButton className="dialogue-close" onClick={onClose}>
              {strings.close}
            </InkButton>
          </div>
          <div className="dialogue-body" onClick={onAdvance}>
            <p ref={textRef} tabIndex={-1} lang="en" className="dialogue-text">
              {/* The whole line is announced while it types; once shown, the visible text is the only copy. */}
              <span className="dialogue-sr-only" aria-live="polite">
                {done ? null : node.text}
              </span>
              <span aria-hidden={done ? undefined : 'true'}>{renderText()}</span>
            </p>
            {error && (
              <p role="alert">
                {strings.dialogueError} {error}
              </p>
            )}
            {done && (
              <div className="dialogue-choices">
                {choices.map(({ choice, seen }, index) => (
                  <InkButton
                    key={choice.id}
                    className={seen ? 'dialogue-choice dialogue-choice--seen' : 'dialogue-choice'}
                    data-sfx="pen"
                    style={{ '--i': index } as CSSProperties}
                    onClick={(event) => onChoose(choice.id, event)}
                  >
                    <span className="dialogue-choice__key" aria-hidden="true">
                      {index + 1}
                    </span>
                    <span className="dialogue-choice__text">
                      {choice.text}
                      {translationMode === 'Beginner' && choice.translationVi && (
                        <small className="dialogue-choice-translation">
                          {choice.translationVi}
                        </small>
                      )}
                    </span>
                    {seen && (
                      <span className="dialogue-choice__seen">{strings.dialogueChoiceSeen}</span>
                    )}
                  </InkButton>
                ))}
              </div>
            )}
          </div>
          <aside className="dialogue-notes" aria-label={strings.dialogueNotesHeading}>
            <h3>{strings.dialogueNotesHeading}</h3>
            {notes.length > 0 ? (
              <ul>
                {notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            ) : (
              <p>{strings.dialogueNotesEmpty}</p>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
