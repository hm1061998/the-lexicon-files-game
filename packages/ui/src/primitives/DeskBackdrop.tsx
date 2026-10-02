import type { ReactNode } from 'react';
import './desk-backdrop.css';

/** The investigation desk: dark wood with a vignette. The props layer is purely decorative. */
export function DeskBackdrop({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}): JSX.Element {
  return (
    <div className={['desk-backdrop', className].filter(Boolean).join(' ')}>
      <div className="desk-backdrop__props" aria-hidden="true">
        <span className="desk-backdrop__ring" />
        <span className="desk-backdrop__scratches" />
      </div>
      {children}
    </div>
  );
}
