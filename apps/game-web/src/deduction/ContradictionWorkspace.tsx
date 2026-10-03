import { InkButton, PaperButton } from '@lexicon/ui';
import { useState } from 'react';
import type { ContradictionResult } from '@lexicon/shared-types';
import type { InvestigationView } from '../investigation/selectInvestigationView';
import type { InvestigationLearningProps } from '../investigation/RecordedStatements';
import type { DeductionUi, DeductionUiAction } from './deductionUiReducer';
import { ChoicePages } from '../investigation/pagination/ChoicePages';
import { ReadDocument, textBlock } from '../investigation/pagination/ReadDocument';
import { pickContradiction } from './pickContradiction';
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
        <InkButton onClick={() => setMode('facts')}>{s.deductionFactsHeading}</InkButton>
        <InkButton disabled={!selected.length} onClick={() => setMode('selected')}>
          {s.investigationReadFull}
        </InkButton>
        <InkButton onClick={() => setMode('results')}>{s.investigationResults}</InkButton>
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
            className={
              mode === 'results'
                ? `notebook-feedback${view.confirmedContradictions.length ? ' contradiction-confirmed' : ''}`
                : ''
            }
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
              empty={
                <p>{view.facts.length ? s.contradictionSelectFacts : s.contradictionUnavailable}</p>
              }
            />
          </div>
        )}
      </div>
      <footer className="workspace-actions">
        <InkButton disabled={!selected.length} onClick={() => dispatch({ type: 'clearFacts' })}>
          {s.deductionClearSelection}
        </InkButton>
        {view.availableContradictions.length > 0 ? (
          <PaperButton
            disabled={selected.length !== 2}
            onClick={() => {
              const target = pickContradiction(view.availableContradictions, ui.selectedFactIds);
              if (!target) return;
              const r = onSubmit(target.id, ui.selectedFactIds);
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
          </PaperButton>
        ) : null}
      </footer>
    </section>
  );
}
