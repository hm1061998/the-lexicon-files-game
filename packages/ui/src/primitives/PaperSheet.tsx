import type { CSSProperties, ElementType, ReactNode } from 'react';
import { PaperClip } from './PaperClip';
import './paper-sheet.css';
import './motion.css';

export type PaperSheetProps = {
  as?: ElementType;
  className?: string;
  edge?: 'clean' | 'torn';
  tone?: 'fresh' | 'aged';
  /** Degrees, clamped to -2..2. Ignored when motion is reduced. */
  tilt?: number;
  clip?: boolean;
  tape?: 'tl' | 'tr';
  children?: ReactNode;
};

const clampTilt = (tilt: number): number => Math.max(-2, Math.min(2, tilt));

export function PaperSheet({
  as: Component = 'div',
  className,
  edge = 'clean',
  tone = 'fresh',
  tilt,
  clip = false,
  tape,
  children,
}: PaperSheetProps): JSX.Element {
  const classes = ['paper-sheet', `paper-sheet--${edge}`, `paper-sheet--${tone}`, className]
    .filter(Boolean)
    .join(' ');
  const style =
    tilt === undefined ? undefined : ({ '--paper-tilt': `${clampTilt(tilt)}deg` } as CSSProperties);
  return (
    <Component className={classes} style={style}>
      {clip ? <PaperClip /> : null}
      {tape ? (
        <span className={`paper-sheet__tape paper-sheet__tape--${tape}`} aria-hidden="true" />
      ) : null}
      {children}
    </Component>
  );
}
