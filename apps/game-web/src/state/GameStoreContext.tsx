import { createContext, useContext, type ReactNode } from 'react';
import { useStore } from 'zustand';
import type { GameState, GameStore } from './gameStore';

const GameStoreContext = createContext<GameStore | null>(null);

export function GameStoreProvider({
  store,
  children,
}: {
  store: GameStore;
  children: ReactNode;
}): JSX.Element {
  return <GameStoreContext.Provider value={store}>{children}</GameStoreContext.Provider>;
}

export function useGameStore<T>(selector: (state: GameState) => T): T {
  const store = useContext(GameStoreContext);
  if (!store) {
    throw new Error('useGameStore must be used within a GameStoreProvider');
  }
  return useStore(store, selector);
}
