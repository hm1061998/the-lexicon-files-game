import { createContext, useContext, type ReactNode } from 'react';
import type { UiSound } from './uiSound';

const UiSoundContext = createContext<UiSound | null>(null);

/** Gives the screens that make their own sound (the recorder's tape) the shared UI sound service. */
export function UiSoundProvider({
  uiSound,
  children,
}: {
  uiSound: UiSound | null;
  children: ReactNode;
}): JSX.Element {
  return <UiSoundContext.Provider value={uiSound}>{children}</UiSoundContext.Provider>;
}

/** The shared UI sound service, or null outside the game (tests, shell screens before settings load). */
export function useUiSound(): UiSound | null {
  return useContext(UiSoundContext);
}
