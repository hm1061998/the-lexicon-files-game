import { useRef } from 'react';
import type { CaseDefinition, GameState } from '@lexicon/shared-types';
import type { InvestigationView } from '../investigation/selectInvestigationView';
import type { InvestigationLearningProps } from '../investigation/RecordedStatements';
import { InvestigationArtwork } from '../investigation/InvestigationArtwork';
import { InvestigationDecoration } from '../investigation/art/InvestigationDecoration';
import { MeasuredPage } from '../investigation/pagination/MeasuredPage';
import { ReadDocument, textBlock } from '../investigation/pagination/ReadDocument';
import { buildNotebookBlocks } from '../notebook/buildNotebookBlocks';
import { DeductionConnections } from './DeductionConnections';
import { DeductionCaseFile } from './DeductionCaseFile';
import type { DeductionUi, DeductionUiAction } from './deductionUiReducer';
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
  const card = (id: string, passive: boolean) => {
    const c = cards.find((c) => c.node === id);
    if (!c) return null;
    return (
      <button
        className="deduction-card"
        type="button"
        aria-label={c.name}
        aria-pressed={ui.selectedNode === c.node}
        data-board-node={passive ? undefined : c.node}
        tabIndex={passive ? -1 : undefined}
        onClick={passive ? undefined : () => dispatch({ type: 'selectNode', id: c.node })}
      >
        <InvestigationDecoration kind="pushpin" variant={c.portrait ? 'dark' : 'brass'} />
        <InvestigationArtwork url={c.image} name={c.name} portrait={c.portrait} />
        <strong>{c.name}</strong>
        <small>{c.subtitle}</small>
      </button>
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
        <div className="notebook-profile-art">
          <InvestigationArtwork url={f.url} name={f.name} portrait={f.portrait} />
        </div>
      ) : (
        <button type="button" onClick={() => onReviewEvidence?.(f.target)}>
          {f.label}
        </button>
      ),
    ]),
  );
  const relationships = view.relationships.map((r, i) =>
    textBlock('relation:' + i, (nodes.get(r.from) ?? '') + ' → ' + (nodes.get(r.to) ?? '')),
  );
  return (
    <div className={`deduction-clues-face ${ui.selectedNode ? 'has-detail' : ''}`}>
      <div className="deduction-clues-toolbar">
        <button
          type="button"
          onClick={() => dispatch({ type: 'selectNode', id: ui.selectedNode ? null : 'case' })}
        >
          {ui.selectedNode ? strings.investigationBack : strings.investigationCaseFile}
        </button>
        <button type="button" onClick={() => dispatch({ type: 'selectNode', id: 'relations' })}>
          {strings.investigationRelations}
        </button>
      </div>
      <aside className="deduction-case desktop-case">
        <DeductionCaseFile definition={definition} state={state} learning={learning} />
      </aside>
      <div className="clues-cards" ref={surface}>
        <DeductionConnections relationships={view.relationships} surface={surface} />
        <MeasuredPage
          blocks={cards.map((c) => ({ kind: 'fixed', id: c.node }))}
          anchor={ui.anchors.clues ?? null}
          onAnchorChange={(a) => dispatch({ type: 'anchor', key: 'clues', anchor: a })}
          renderFragment={(f) => card(f.blockId, false)}
          renderMeasurement={(f) => card(f.blockId, true)}
          strings={strings}
          controlsLabel={strings.deductionCluesFace}
          empty={<p>{strings.evidenceEmpty}</p>}
        />
      </div>
      <article className="deduction-detail">
        {ui.selectedNode === 'case' ? (
          <DeductionCaseFile definition={definition} state={state} learning={learning} />
        ) : ui.selectedNode === 'relations' ? (
          <ReadDocument
            blocks={relationships}
            learning={learning}
            label={strings.investigationRelations}
          />
        ) : detail ? (
          <ReadDocument
            blocks={detail.blocks}
            fixed={fixed}
            learning={learning}
            label={chosen!.name}
            anchor={ui.anchors[chosen!.node] ?? null}
            onAnchorChange={(a) => dispatch({ type: 'anchor', key: chosen!.node, anchor: a })}
          />
        ) : (
          <ReadDocument
            blocks={[textBlock('clues:instructions', strings.deductionInstructions)]}
            learning={learning}
            label={strings.deductionCluesFace}
          />
        )}
      </article>
    </div>
  );
}
