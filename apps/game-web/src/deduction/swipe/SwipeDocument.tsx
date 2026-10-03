import type { ReactNode } from 'react';
import type { PageAnchor, ReaderBlock } from '../../investigation/pagination/pageTypes';
import { ReaderTextFragment } from '../../investigation/pagination/ReadDocument';
import type { InvestigationLearningProps } from '../../investigation/RecordedStatements';
import { SwipeRow } from './SwipeRow';

/** A reading on the board: it scrolls up and down by touch or mouse drag, with no pages and no scroll bar. */
export function SwipeDocument({
  blocks,
  fixed = {},
  label,
  learning,
  empty,
}: {
  blocks: readonly ReaderBlock[];
  fixed?: Readonly<Record<string, ReactNode>>;
  label: string;
  learning: InvestigationLearningProps;
  empty?: ReactNode;
  // Accepted so a page-turning reader can be swapped for this one; swiping needs none of them.
  anchor?: PageAnchor | null;
  onAnchorChange?: ((a: PageAnchor) => void) | undefined;
  onPageTurn?: (() => void) | undefined;
  revision?: string;
}): JSX.Element {
  if (!blocks.length) return <div className="swipe-empty">{empty}</div>;
  return (
    <SwipeRow label={label} axis="y" className="swipe-document">
      {blocks.map((block) =>
        block.kind === 'fixed' ? (
          <div className="swipe-fixed" key={block.id}>
            {fixed[block.id] ?? null}
          </div>
        ) : (
          <ReaderTextFragment
            key={block.id}
            block={block}
            fragment={{ blockId: block.id, start: 0, end: block.text.length, spans: block.spans }}
            passive={false}
            learning={learning}
          />
        ),
      )}
    </SwipeRow>
  );
}
