import type { ReactNode } from 'react';
import './keycap.css';

export function Keycap({ children }: { children: ReactNode }): JSX.Element {
  return <kbd className="keycap">{children}</kbd>;
}
