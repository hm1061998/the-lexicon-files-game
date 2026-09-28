import type { ReactNode } from 'react';

export function Keycap({ children }: { children: ReactNode }): JSX.Element {
  return <kbd className="keycap">{children}</kbd>;
}
