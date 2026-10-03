import './conclusion.css';
import { InkButton, PaperButton, PinnedCard } from '@lexicon/ui';
import { InvestigationArtwork } from '../investigation/InvestigationArtwork';
import { SwipeRow } from '../deduction/swipe/SwipeRow';
import { SwipeDocument } from '../deduction/swipe/SwipeDocument';
import { textBlock } from '../investigation/pagination/ReadDocument';
import type { InvestigationLearningProps } from '../investigation/RecordedStatements';
import { useId, useState } from 'react';
import type { AccusationResult, UiStrings } from '@lexicon/shared-types';

export type AccusationSuspect = { readonly id: string; readonly name: string };

/** Maps a reducer result to the feedback line; the correct answer is never known here. */
export function accusationFeedback(result: AccusationResult, strings: UiStrings): string | null {
  if (!result.ok) return strings.conclusionUnavailable;
  return result.correct ? null : strings.conclusionMismatch;
}

/** One suspect pinned to the board: portrait (or initials), name, hung slightly off-square. */
function SuspectCard({
  suspect,
  index,
  portrait,
  selected,
  onSelect,
}: {
  suspect: AccusationSuspect;
  index: number;
  portrait?: string | undefined;
  selected: boolean;
  onSelect?: (() => void) | undefined;
}): JSX.Element {
  return (
    <PinnedCard
      as="button"
      type="button"
      className="suspect-card"
      tilt={index % 2 === 0 ? -0.6 : 0.6}
      selected={selected}
      aria-label={suspect.name}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <InvestigationArtwork url={portrait} name={suspect.name} portrait />
      <strong>{suspect.name}</strong>
    </PinnedCard>
  );
}

export function AccusationPanel({
  suspects,
  strings,
  onSubmit,
  learning,
  selection,
  onSelectionChange,
  feedback: controlledFeedback,
  onFeedbackChange,
  portraits,
}: {
  suspects: readonly AccusationSuspect[];
  strings: UiStrings;
  onSubmit(suspectNpcId: string): AccusationResult;
  learning?: InvestigationLearningProps;
  selection?: string | null;
  onSelectionChange?: (id: string) => void;
  feedback?: string;
  onFeedbackChange?: (text: string) => void;
  /** Suspect id → portrait image; a suspect without one shows initials. */
  portraits?: Readonly<Record<string, string>>;
}): JSX.Element {
  const promptId = useId();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  function submit(): void {
    if (!selectedId) return;
    setFeedback(accusationFeedback(onSubmit(selectedId), strings));
  }

  if (learning) {
    const chosen = selection ?? null;
    const card = (id: string) => {
      const index = suspects.findIndex((x) => x.id === id);
      const suspect = suspects[index];
      return suspect ? (
        <SuspectCard
          key={id}
          suspect={suspect}
          index={index}
          portrait={portraits?.[id]}
          selected={chosen === id}
          onSelect={() => onSelectionChange?.(id)}
        />
      ) : null;
    };
    return (
      <section className="accusation-panel paginated-workspace">
        <h3>{strings.conclusionPrompt}</h3>
        <div className="workspace-reading">
          {controlledFeedback ? (
            <div className="notebook-feedback" role="status">
              <SwipeDocument
                blocks={[textBlock('accusation:feedback', controlledFeedback)]}
                learning={learning}
                label={strings.investigationResults}
              />
            </div>
          ) : (
            <SwipeRow label={strings.conclusion}>
              <div className="swipe-track">{suspects.map((x) => card(x.id))}</div>
            </SwipeRow>
          )}
        </div>
        <footer className="workspace-actions">
          {controlledFeedback && (
            <InkButton sfx="paper-close" onClick={() => onFeedbackChange?.('')}>
              {strings.investigationBack}
            </InkButton>
          )}
          <PaperButton
            disabled={!chosen}
            onClick={() => {
              if (chosen) onFeedbackChange?.(accusationFeedback(onSubmit(chosen), strings) ?? '');
            }}
          >
            {strings.conclusionSubmit}
          </PaperButton>
        </footer>
      </section>
    );
  }
  return (
    <section className="accusation-panel" aria-labelledby={promptId}>
      <p id={promptId}>{strings.conclusionPrompt}</p>
      <div className="accusation-suspects" role="group" aria-labelledby={promptId}>
        {suspects.map((suspect, index) => (
          <SuspectCard
            key={suspect.id}
            suspect={suspect}
            index={index}
            portrait={portraits?.[suspect.id]}
            selected={selectedId === suspect.id}
            onSelect={() => {
              setSelectedId(suspect.id);
              setFeedback(null);
            }}
          />
        ))}
      </div>
      <PaperButton disabled={selectedId === null} onClick={submit}>
        {strings.conclusionSubmit}
      </PaperButton>
      <p role="status" aria-live="polite" className="notebook-feedback">
        {feedback ?? ''}
      </p>
    </section>
  );
}
