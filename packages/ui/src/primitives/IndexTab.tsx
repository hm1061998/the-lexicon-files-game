import type { ReactNode } from 'react';
import './index-tab.css';

export function IndexTab({
  className,
  tone = 'fresh',
  children,
}: {
  className?: string;
  tone?: 'fresh' | 'aged';
  children: ReactNode;
}): JSX.Element {
  return (
    <div className={['index-tab', `index-tab--${tone}`, className].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}
