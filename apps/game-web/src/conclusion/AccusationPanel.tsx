import {ChoicePages} from '../investigation/pagination/ChoicePages';
import {ReadDocument,textBlock} from '../investigation/pagination/ReadDocument';
import type {InvestigationLearningProps} from '../investigation/RecordedStatements';
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
  onSubmit, learning, selection, onSelectionChange, feedback:controlledFeedback, onFeedbackChange,
}: {
  suspects: readonly AccusationSuspect[];
  strings: UiStrings;
  onSubmit(suspectNpcId: string): AccusationResult;
  learning?:InvestigationLearningProps;selection?:string|null;onSelectionChange?:(id:string)=>void;feedback?:string;onFeedbackChange?:(text:string)=>void;
}): JSX.Element {
  const promptId = useId();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  function submit(): void {
    if (!selectedId) return;
    setFeedback(accusationFeedback(onSubmit(selectedId), strings));
  }

  if(learning){const chosen=selection??null;return <section className="accusation-panel paginated-workspace"><h3>{strings.conclusionPrompt}</h3><div className="workspace-reading">{controlledFeedback?<div className="notebook-feedback" role="status"><ReadDocument blocks={[textBlock('accusation:feedback',controlledFeedback)]} learning={learning} label={strings.investigationResults}/></div>:<ChoicePages choices={suspects.map(s=>({id:s.id,label:s.name}))} selected={chosen?[chosen]:[]} onSelect={id=>onSelectionChange?.(id)} strings={strings} label={strings.conclusion}/>}</div><footer className="workspace-actions">{controlledFeedback&&<button type="button" onClick={()=>onFeedbackChange?.('')}>{strings.investigationBack}</button>}<button type="button" disabled={!chosen} onClick={()=>{if(chosen)onFeedbackChange?.(accusationFeedback(onSubmit(chosen),strings)??'');}}>{strings.conclusionSubmit}</button></footer></section>;}
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
