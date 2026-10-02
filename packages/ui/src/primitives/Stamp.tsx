import type { ReactNode } from 'react';
import './stamp.css';

export function Stamp({
  className,
  animate = false,
  children,
}: {
  className?: string;
  animate?: boolean;
  children: ReactNode;
}): JSX.Element {
  const classes = ['stamp', animate ? 'stamp--animate' : undefined, className]
    .filter(Boolean)
    .join(' ');
  return <span className={classes}>{children}</span>;
}
