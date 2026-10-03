import { useRef } from 'react';
import { InkButton, PinnedCard } from '@lexicon/ui';
import type { CaseDefinition, GameState } from '@lexicon/shared-types';
import type { InvestigationView } from '../investigation/selectInvestigationView';
import type { InvestigationLearningProps } from '../investigation/RecordedStatements';
import { InvestigationArtwork } from '../investigation/InvestigationArtwork';
import { textBlock } from '../investigation/pagination/ReadDocument';
import { SwipeRow } from './swipe/SwipeRow';
import { SwipeDocument } from './swipe/SwipeDocument';
import { buildNotebookBlocks } from '../notebook/buildNotebookBlocks';
import { DeductionConnections } from './DeductionConnections';
import { DeductionCaseFile } from './DeductionCaseFile';
import type { DeductionUi, DeductionUiAction } from './deductionUiReducer';
/** Cards hang slightly off-square, alternating, so the board does not look like a grid. */
const tiltFor = (index: number): number => (index % 2 === 0 ? -0.6 : 0.6);
export function DeductionCluesFace({
  definition,
  state,
  view,
  ui,
  dispatch,
  learning,
  onReviewEvidence,
}: {
  definition: CaseDefinition;
  state: GameState;
  view: InvestigationView;
  ui: DeductionUi;
  dispatch: (a: DeductionUiAction) => void;
  learning: InvestigationLearningProps;
  onReviewEvidence?: ((id: string) => void) | undefined;
}) {
  const surface = useRef<HTMLDivElement>(null);
  const strings = learning.strings;
  const people = buildNotebookBlocks(
    definition,
    view,
    'people',
    null,
    strings,
    learning.translationMode,
  ).items;
  const evidence = buildNotebookBlocks(
    definition,
    view,
    'evidence',
    null,
    strings,
    learning.translationMode,
  ).items;
  const cards = [
    ...people.map((p) => ({ ...p, node: 'person:' + p.id })),
    ...evidence.map((e) => ({ ...e, node: 'evidence:' + e.id })),
  ];
  const nodes = new Map([
    ...cards.map((c) => [c.node, c.name] as const),
    ...view.facts.map((f) => ['fact:' + f.id, f.text] as const),
  ]);
  const card = (id: string) => {
    const c = cards.find((c) => c.node === id);
    if (!c) return null;
    return (
      <PinnedCard
        key={c.node}
        as="button"
        type="button"
        className="deduction-card"
        tilt={tiltFor(cards.indexOf(c))}
        selected={ui.selectedNode === c.node}
        aria-label={c.name}
        aria-pressed={ui.selectedNode === c.node}
        data-board-node={c.node}
        onClick={() => dispatch({ type: 'selectNode', id: c.node })}
      >
        <InvestigationArtwork url={c.image} name={c.name} portrait={c.portrait} />
        <strong>{c.name}</strong>
        <small>{c.subtitle}</small>
      </PinnedCard>
    );
  };
  const chosen = cards.find((c) => c.node === ui.selectedNode);
  const detail = chosen
    ? buildNotebookBlocks(
        definition,
        view,
        chosen.portrait ? 'people' : 'evidence',
        chosen.id,
        strings,
        learning.translationMode,
      )
    : null;
  const fixed = Object.fromEntries(
    Object.entries(detail?.fixed ?? {}).map(([id, f]) => [
      id,
      f.kind === 'image' ? (
        <PinnedCard className="notebook-profile-art" pin="tape" tilt={-2}>
          <InvestigationArtwork url={f.url} name={f.name} portrait={f.portrait} />
        </PinnedCard>
      ) : (
        <InkButton onClick={() => onReviewEvidence?.(f.target)}>{f.label}</InkButton>
      ),
    ]),
  );
  const relationships = view.relationships.map((r, i) =>
    textBlock('relation:' + i, (nodes.get(r.from) ?? '') + ' → ' + (nodes.get(r.to) ?? '')),
  );
  return (
    <div className={`deduction-clues-face ${ui.selectedNode ? 'has-detail' : ''}`}>
      <div className="deduction-clues-toolbar">
        <InkButton
          className="clues-toggle"
          aria-pressed={ui.selectedNode === 'case'}
          onClick={() => dispatch({ type: 'selectNode', id: ui.selectedNode ? null : 'case' })}
        >
          {ui.selectedNode ? strings.investigationBack : strings.investigationCaseFile}
        </InkButton>
        <InkButton
          className="clues-toggle"
          aria-pressed={ui.selectedNode === 'relations'}
          onClick={() => dispatch({ type: 'selectNode', id: 'relations' })}
        >
          {strings.investigationRelations}
        </InkButton>
      </div>
      <aside className="deduction-case desktop-case">
        <DeductionCaseFile definition={definition} state={state} learning={learning} />
      </aside>
      <div className="clues-cards">
        <SwipeRow label={strings.deductionCluesFace}>
          <div className="swipe-track" ref={surface}>
            <DeductionConnections relationships={view.relationships} surface={surface} />
            {cards.length ? cards.map((c) => card(c.node)) : <p>{strings.evidenceEmpty}</p>}
          </div>
        </SwipeRow>
        {!ui.selectedNode && <p className="clues-sticky">{strings.deductionInstructions}</p>}
      </div>
      {ui.selectedNode ? (
        <article className="deduction-detail">
          {ui.selectedNode === 'case' ? (
            <DeductionCaseFile definition={definition} state={state} learning={learning} />
          ) : ui.selectedNode === 'relations' ? (
            <SwipeDocument
              blocks={relationships}
              learning={learning}
              label={strings.investigationRelations}
            />
          ) : detail ? (
            <SwipeDocument
              blocks={detail.blocks}
              fixed={fixed}
              learning={learning}
              label={chosen!.name}
              anchor={ui.anchors[chosen!.node] ?? null}
              onAnchorChange={(a) => dispatch({ type: 'anchor', key: chosen!.node, anchor: a })}
            />
          ) : null}
        </article>
      ) : null}
    </div>
  );
}
