import { useEffect, useRef } from 'react';
import { InkButton, PaperButton, PinnedCard } from '@lexicon/ui';
import type { ContradictionResult } from '@lexicon/shared-types';
import type { InvestigationView } from '../investigation/selectInvestigationView';
import type { InvestigationLearningProps } from '../investigation/RecordedStatements';
import type { DeductionUi, DeductionUiAction } from './deductionUiReducer';
import { pickContradiction } from './pickContradiction';
import { SwipeRow } from './swipe/SwipeRow';

/**
 * Compare two facts: the facts are pinned cards laid out in a grid, the two picked ones appear in the
 * frames A and B beside it, and the result comes back as a sticky note, never as a verdict banner.
 */
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
  const s = learning.strings;
  const results = useRef<HTMLDivElement>(null);
  // The panel scrolls without a bar: bring a new result into view so a check always shows its answer.
  useEffect(() => {
    if (ui.feedback) results.current?.scrollIntoView?.({ block: 'nearest' });
  }, [ui.feedback]);
  const picked = ui.selectedFactIds
    .map((id) => view.facts.find((f) => f.id === id))
    .filter((f): f is NonNullable<typeof f> => f !== undefined);
  const submit = () => {
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
  };
  const frame = (label: string, fact: (typeof picked)[number] | undefined) => (
    <div className={`compare-frame ${fact ? 'is-filled' : ''}`}>
      <span className="compare-frame__label">{label}</span>
      {fact ? (
        fact.text
      ) : (
        <span className="compare-frame__empty">{s.contradictionSelectFacts}</span>
      )}
    </div>
  );
  return (
    <section className="compare-board">
      <div className="compare-facts deduction-facts">
        <h3 className="compare-heading">{s.deductionFactsHeading}</h3>
        {view.facts.length ? (
          <SwipeRow axis="y" label={s.deductionFactsHeading}>
            <div className="compare-grid">
              {view.facts.map((f, i) => {
                const on = ui.selectedFactIds.includes(f.id);
                return (
                  <PinnedCard
                    as="button"
                    type="button"
                    key={f.id}
                    className="compare-fact"
                    tilt={[-0.8, 0.7, -0.5, 0.9][i % 4] ?? 0}
                    selected={on}
                    aria-label={f.text}
                    aria-pressed={on}
                    data-board-node={'fact:' + f.id}
                    disabled={!on && picked.length === 2}
                    onClick={() => dispatch({ type: 'toggleFact', id: f.id })}
                  >
                    {f.text}
                  </PinnedCard>
                );
              })}
            </div>
          </SwipeRow>
        ) : (
          <p>{s.contradictionUnavailable}</p>
        )}
      </div>
      <aside className="compare-panel">
        <SwipeRow axis="y" label={s.investigationResults}>
          <div className="compare-panel__body">
            <p className="deduction-selection-count">
              {s.contradictionSelectedCount}: {picked.length}/2
            </p>
            {frame('A', picked[0])}
            {frame('B', picked[1])}
            <div className="workspace-actions">
              <InkButton disabled={!picked.length} onClick={() => dispatch({ type: 'clearFacts' })}>
                {s.deductionClearSelection}
              </InkButton>
              {view.availableContradictions.length > 0 ? (
                <PaperButton disabled={picked.length !== 2} onClick={submit}>
                  {s.contradictionSubmit}
                </PaperButton>
              ) : null}
            </div>
            <div role="status" className="compare-results" ref={results}>
              {ui.feedback ? (
                <p className="notebook-feedback compare-sticky">{ui.feedback}</p>
              ) : null}
              {view.confirmedContradictions.map((c) => (
                <div
                  className="notebook-feedback contradiction-confirmed compare-sticky"
                  key={c.id}
                >
                  <strong>{s.contradictionFound}</strong>
                  <p>{c.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        </SwipeRow>
      </aside>
    </section>
  );
}
