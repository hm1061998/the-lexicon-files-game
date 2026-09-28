import { createStore, type StoreApi } from 'zustand/vanilla';
import type { CaseSummary } from '@lexicon/shared-types';

export type GameState = {
  caseTitle: string;
  currentObjective: { id: string; text: string } | null;
  evidenceCollected: number;
  evidenceTotal: number;
  nearby: { id: string; prompt: string } | null;
  paused: boolean;
  inputLocked: boolean;
  setNearby(n: { id: string; prompt: string } | null): void;
  togglePause(): void;
  setPaused(p: boolean): void;
};

export type GameStore = StoreApi<GameState>;

export function createGameStore(init: { caseSummary: CaseSummary }): GameStore {
  return createStore<GameState>((set) => ({
    caseTitle: init.caseSummary.title,
    currentObjective: init.caseSummary.initialObjective,
    evidenceCollected: 0,
    evidenceTotal: init.caseSummary.evidenceTotal,
    nearby: null,
    paused: false,
    inputLocked: false,
    setNearby(n) {
      set({ nearby: n });
    },
    togglePause() {
      set((state) => ({ paused: !state.paused, inputLocked: !state.paused }));
    },
    setPaused(p) {
      set({ paused: p, inputLocked: p });
    },
  }));
}
