import { useState, useEffect } from 'react';
import { InkButton, PaperButton, PinnedCard } from '@lexicon/ui';
import type { CaseDefinition, LanguageProfile } from '@lexicon/shared-types';
import type { NotebookTab } from '../state/gameStore';
import type { InvestigationView } from '../investigation/selectInvestigationView';
import type { InvestigationLearningProps } from '../investigation/RecordedStatements';
import { InvestigationArtwork } from '../investigation/InvestigationArtwork';
import { ReaderTextFragment, textBlock } from '../investigation/pagination/ReadDocument';
import type { PageFragment, ReaderBlock } from '../investigation/pagination/pageTypes';
import { SpreadReader } from './SpreadReader';
import { buildNotebookBlocks } from './buildNotebookBlocks';
import type { NotebookReadingState } from './notebookReadingState';
export function NotebookReaderPage({
  definition,
  view,
  tab,
  reading,
  onReadingChange,
  learning,
  profile,
  onReviewEvidence,
  onOpenDeduction,
  onPaperCue,
}: {
  definition: CaseDefinition;
  view: InvestigationView;
  tab: NotebookTab;
  reading: NotebookReadingState;
  onReadingChange: (s: NotebookReadingState) => void;
  learning: InvestigationLearningProps;
  profile?: LanguageProfile | undefined;
  onReviewEvidence: (id: string) => void;
  onOpenDeduction: () => void;
  onPaperCue?: (() => void) | undefined;
}) {
  const [revealed, setRevealed] = useState<string | null>(null);
  useEffect(() => setRevealed(null), [tab, learning.translationMode]);
  const state = reading.tabs[tab],
    { strings } = learning;
  const data = buildNotebookBlocks(
    definition,
    view,
    tab,
    state.selectedId,
    strings,
    learning.translationMode,
    profile,
    revealed !== null && revealed === state.selectedId,
  );
  const patch = (next: Partial<typeof state>) =>
    onReadingChange({ ...reading, tabs: { ...reading.tabs, [tab]: { ...state, ...next } } });
  const select = (id: string) => {
    setRevealed(null);
    patch({ selectedId: id, view: 'detail', detailAnchor: null });
  };
  const fixed = Object.fromEntries(
    Object.entries(data.fixed).map(([id, f]) => [
      id,
      f.kind === 'image' ? (
        <PinnedCard className="notebook-profile-art" pin="tape" tilt={-2} key={id}>
          <InvestigationArtwork url={f.url} name={f.name} portrait={f.portrait} />
        </PinnedCard>
      ) : (
        <InkButton
          key={id}
          onClick={() => {
            if (f.action === 'review') onReviewEvidence(f.target);
            else if (f.action === 'board') onOpenDeduction();
            else {
              const word = profile?.vocabulary[f.target];
              if (word?.contextsSeen[0]) {
                learning.onRevealTranslation(f.target, word.contextsSeen[0]);
                patch({ selectedId: f.target });
                setRevealed(f.target);
              }
            }
          }}
        >
          {f.label}
        </InkButton>
      ),
    ]),
  );
  const heading =
    tab === 'people'
      ? strings.notebookPeopleHeading
      : tab === 'evidence'
        ? strings.notebookEvidenceHeading
        : tab === 'vocabulary'
          ? strings.notebookVocabularyHeading
          : strings.timeline;
  const card = (id: string, passive: boolean) => {
    const i = data.items.find((i) => i.id === id)!;
    return (
      <PaperButton
        className="notebook-index-card"
        tabIndex={passive ? -1 : undefined}
        aria-label={i.name}
        aria-pressed={i.id === state.selectedId}
        onClick={passive ? undefined : () => select(i.id)}
      >
        {i.image && <InvestigationArtwork url={i.image} name={i.name} portrait={i.portrait} />}
        <span>
          <strong>{i.name}</strong>
          <small>{i.subtitle}</small>
        </span>
      </PaperButton>
    );
  };
  const empty =
    tab === 'people'
      ? strings.notebookEmptyPeople
      : tab === 'evidence'
        ? strings.evidenceEmpty
        : tab === 'timeline'
          ? strings.timelineEmpty
          : strings.notebookEmptyVocabulary;
  const detail = state.view === 'detail' && data.items.length > 0;
  // Contents: one list that runs from the left leaf to the right one. Detail: one write-up that does too.
  const contentsBlocks: ReaderBlock[] = [
    textBlock(`${tab}:title`, heading),
    ...(data.items.length
      ? data.items.map((i) => ({ kind: 'fixed' as const, id: i.id }))
      : [
          textBlock(`${tab}:empty`, empty),
          ...(tab === 'timeline' ? [{ kind: 'fixed' as const, id: 'timeline:board' }] : []),
        ]),
  ];
  const fragment = (f: PageFragment, passive: boolean) => {
    const block = (detail ? data.blocks : contentsBlocks).find((b) => b.id === f.blockId);
    if (!block) return null;
    if (block.kind === 'fixed')
      return detail ? (
        (fixed[block.id] ?? null)
      ) : block.id === 'timeline:board' ? (
        <PaperButton onClick={onOpenDeduction} tabIndex={passive ? -1 : undefined}>
          {strings.openDeductionBoard}
        </PaperButton>
      ) : (
        card(block.id, passive)
      );
    return <ReaderTextFragment block={block} fragment={f} passive={passive} learning={learning} />;
  };
  return (
    <div className={`notebook-spread spread-view view-${state.view} tab-${tab}`}>
      {detail && (
        <InkButton
          className="notebook-back-contents"
          aria-label={strings.notebookBackToContents}
          sfx="paper-close"
          onClick={() => patch({ view: 'contents' })}
        >
          ‹ {strings.notebookBackToContents}
        </InkButton>
      )}
      <article
        className={`notebook-detail ${tab === 'people' ? 'notebook-person' : tab === 'evidence' ? 'notebook-evidence-detail' : tab === 'vocabulary' ? 'notebook-word-detail' : 'notebook-timeline-detail'}`}
        aria-label={detail ? (data.selected?.name ?? heading) : heading}
      >
        <SpreadReader
          key={detail ? `detail:${data.selected?.id}` : 'contents'}
          blocks={detail ? data.blocks : contentsBlocks}
          anchor={detail ? state.detailAnchor : state.contentsAnchor}
          onAnchorChange={(a) => patch(detail ? { detailAnchor: a } : { contentsAnchor: a })}
          renderFragment={(f) => fragment(f, false)}
          renderMeasurement={(f) => fragment(f, true)}
          strings={strings}
          label={detail ? (data.selected?.name ?? heading) : strings.notebookContents}
          revision={learning.translationMode + String(revealed) + state.view}
          empty={<p>{empty}</p>}
          onPaperCue={onPaperCue}
        />
      </article>
    </div>
  );
}
