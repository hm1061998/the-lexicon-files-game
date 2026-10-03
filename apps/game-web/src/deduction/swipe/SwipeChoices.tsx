import type { ReactNode } from 'react';
import { InkButton } from '@lexicon/ui';
import type { UiStrings } from '@lexicon/shared-types';
import type { PageAnchor } from '../../investigation/pagination/pageTypes';
import { SwipeRow } from './SwipeRow';

/** Choices laid out as paper slips in one row to swipe through (the board's answer to paged lists). */
export function SwipeChoices({
  choices,
  selected = [],
  onSelect,
  label,
  disabled,
  boardPrefix,
  empty,
}: {
  choices: readonly { id: string; label: string; secondary?: string }[];
  selected?: readonly string[];
  onSelect: (id: string) => void;
  label: string;
  disabled?: (id: string) => boolean;
  boardPrefix?: string;
  empty?: ReactNode;
  // Accepted so ChoicePages can be swapped for this; swiping needs none of them.
  strings?: UiStrings;
  anchor?: PageAnchor | null | undefined;
  onAnchorChange?: ((a: PageAnchor) => void) | undefined;
}): JSX.Element {
  if (!choices.length) return <div className="swipe-empty">{empty}</div>;
  return (
    <SwipeRow label={label} className="swipe-choices">
      {choices.map((c) => (
        <InkButton
          key={c.id}
          className="paginated-choice swipe-choice"
          data-board-node={boardPrefix ? boardPrefix + c.id : undefined}
          aria-label={c.label}
          aria-pressed={selected.includes(c.id)}
          disabled={disabled?.(c.id)}
          onClick={() => onSelect(c.id)}
        >
          <span className="page-text">{c.label + (c.secondary ? '\n' + c.secondary : '')}</span>
        </InkButton>
      ))}
    </SwipeRow>
  );
}
