import { useId, useState } from 'react';
import type { AccusationResult, UiStrings } from '@lexicon/shared-types';

export type AccusationSuspect = { readonly id: string; readonly name: string };

/** Maps a reducer result to the feedback line; the correct answer is never known here. */
export function accusationFeedback(result: AccusationResult, strings: UiStrings): string | null {
  if (!result.ok) return strings.conclusionUnavailable;
  return result.correct ? null : strings.conclusionMismatch;
}

export function AccusationPanel({
  suspects,
  strings,
  onSubmit,
}: {
  suspects: readonly AccusationSuspect[];
  strings: UiStrings;
  onSubmit(suspectNpcId: string): AccusationResult;
}): JSX.Element {
  const promptId = useId();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  function submit(): void {
    if (!selectedId) return;
    setFeedback(accusationFeedback(onSubmit(selectedId), strings));
  }

  return (
    <section className="accusation-panel" aria-labelledby={promptId}>
      <p id={promptId}>{strings.conclusionPrompt}</p>
      <div className="accusation-suspects" role="group" aria-labelledby={promptId}>
        {suspects.map((suspect) => (
          <button
            key={suspect.id}
            type="button"
            aria-pressed={selectedId === suspect.id}
            onClick={() => {
              setSelectedId(suspect.id);
              setFeedback(null);
            }}
          >
            {suspect.name}
          </button>
        ))}
      </div>
      <button type="button" disabled={selectedId === null} onClick={submit}>
        {strings.conclusionSubmit}
      </button>
      <p role="status" aria-live="polite" className="notebook-feedback">
        {feedback ?? ''}
      </p>
    </section>
  );
}
