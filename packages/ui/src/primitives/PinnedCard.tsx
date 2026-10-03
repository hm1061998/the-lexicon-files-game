import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { PaperSheet } from './PaperSheet';
import './pinned-card.css';

export type PinnedCardProps = Omit<HTMLAttributes<HTMLElement>, 'className' | 'children'> & {
  as?: ElementType;
  /** What holds the card to the board: a pin (default) or a strip of tape. */
  pin?: 'pin' | 'tape';
  /** Degrees, clamped to -2..2 by the paper. Ignored when motion is reduced. */
  tilt?: number;
  selected?: boolean;
  className?: string;
  children?: ReactNode;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
};

/** A paper card pinned or taped to a board; `selected` is the one place the investigation red outlines it. */
export function PinnedCard({
  as,
  pin = 'pin',
  tilt,
  selected = false,
  className,
  children,
  ...rest
}: PinnedCardProps): JSX.Element {
  const classes = ['pinned-card', selected ? 'pinned-card--selected' : undefined, className]
    .filter(Boolean)
    .join(' ');
  return (
    <PaperSheet
      {...(as ? { as } : {})}
      {...(tilt === undefined ? {} : { tilt })}
      className={classes}
      edge="clean"
      tone="fresh"
      {...rest}
    >
      <span
        className={pin === 'tape' ? 'pinned-card__tape' : 'pinned-card__pin'}
        aria-hidden="true"
      />
      {children}
    </PaperSheet>
  );
}
