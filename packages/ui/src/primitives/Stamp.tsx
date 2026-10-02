import type { HTMLAttributes, ReactNode } from 'react';
import './stamp.css';

/** An ink stamp. Ink (brown) by default; red is reserved for the case-closed verdict. */
export function Stamp({
  className,
  animate = false,
  tone = 'ink',
  children,
  ...rest
}: {
  className?: string;
  animate?: boolean;
  tone?: 'ink' | 'red';
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLSpanElement>, 'className' | 'children'>): JSX.Element {
  const classes = ['stamp', `stamp--${tone}`, animate ? 'stamp--animate' : undefined, className]
    .filter(Boolean)
    .join(' ');
  return (
    <span className={classes} {...rest}>
      {children}
    </span>
  );
}
