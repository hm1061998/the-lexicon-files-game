import { useState } from 'react';
import type { ContradictionResult } from '@lexicon/shared-types';
import type { InvestigationView } from '../investigation/selectInvestigationView';
import type { InvestigationLearningProps } from '../investigation/RecordedStatements';
import type { DeductionUi, DeductionUiAction } from './deductionUiReducer';
import { ChoicePages } from '../investigation/pagination/ChoicePages';
import { ReadDocument, textBlock } from '../investigation/pagination/ReadDocument';
export function ContradictionWorkspace({
  view,
  learning,
  ui,
  dispatch,
  onSubmit,
}: {
  view: InvestigationView;
  learning: InvestigationLearningProps;
  ui: DeductionUi;
  dispatch: (a: DeductionUiAction) => void;
  onSubmit: (id: string, factIds: readonly string[]) => ContradictionResult;
}) {
  const [mode, setMode] = useState<'facts' | 'results' | 'selected'>(
    view.confirmedContradictions.length ? 'results' : 'facts',
  );
  const s = learning.strings;
  const selected = view.facts.filter((f) => ui.selectedFactIds.includes(f.id));
  const resultBlocks = [
    ...(ui.feedback ? [textBlock('compare:feedback', ui.feedback)] : []),
    ...view.confirmedContradictions.flatMap((c) => [
      textBlock(c.id + ':title', s.contradictionFound),
      textBlock(c.id + ':explanation', c.explanation),
    ]),
  ];
  return (
    <section className="paginated-workspace compare-workspace">
      <nav className="workspace-steps">
        <button type="button" onClick={() => setMode('facts')}>
          {s.deductionFactsHeading}
        </button>
        <button type="button" disabled={!selected.length} onClick={() => setMode('selected')}>
          {s.investigationReadFull}
        </button>
        <button type="button" onClick={() => setMode('results')}>
          {s.investigationResults}
        </button>
      </nav>
      <p className="deduction-selection-count">
        {s.contradictionSelectedCount}: {selected.length}/2
      </p>
      <div className="workspace-reading deduction-facts">
        {mode === 'facts' ? (
          <ChoicePages
            choices={view.facts.map((f) => ({ id: f.id, label: f.text }))}
            selected={ui.selectedFactIds}
            onSelect={(id) => dispatch({ type: 'toggleFact', id })}
            disabled={(id) => !ui.selectedFactIds.includes(id) && selected.length === 2}
            strings={s}
            label={s.deductionFactsHeading}
            boardPrefix="fact:"
            anchor={ui.anchors.facts}
            onAnchorChange={(a) => dispatch({ type: 'anchor', key: 'facts', anchor: a })}
          />
        ) : (
          <div
            className={mode === 'results' ? 'notebook-feedback' : ''}
            role={mode === 'results' ? 'status' : undefined}
          >
            <ReadDocument
              blocks={
                mode === 'selected'
                  ? selected.map((f) => textBlock(f.id + ':text', f.text))
                  : resultBlocks
              }
              learning={learning}
              label={mode === 'selected' ? s.investigationReadFull : s.investigationResults}
              empty={<p>{s.contradictionUnavailable}</p>}
            />
          </div>
        )}
      </div>
      <footer className="workspace-actions">
        <button
          type="button"
          disabled={!selected.length}
          onClick={() => dispatch({ type: 'clearFacts' })}
        >
          {s.deductionClearSelection}
        </button>
        {view.availableContradictions.map((c) => (
          <button
            type="button"
            key={c.id}
            disabled={selected.length !== 2}
            onClick={() => {
              const r = onSubmit(c.id, ui.selectedFactIds);
              if (r.ok && r.correct) dispatch({ type: 'clearFacts' });
              dispatch({
                type: 'setFeedback',
                text:
                  r.ok && r.correct
                    ? s.contradictionFound
                    : s.contradictionMismatch + ' ' + s.contradictionMismatchHint,
              });
              setMode('results');
            }}
          >
            {s.contradictionSubmit}
          </button>
        ))}
      </footer>
    </section>
  );
}
