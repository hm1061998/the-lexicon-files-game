import type { ElementType, ReactNode } from 'react';

export function PaperPanel({
  as: Component = 'div',
  className,
  children,
}: {
  as?: ElementType;
  className?: string;
  children?: ReactNode;
}): JSX.Element {
  const classes = ['paper-panel', className].filter(Boolean).join(' ');
  return <Component className={classes}>{children}</Component>;
}
