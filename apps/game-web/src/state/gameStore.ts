import { createStore, type StoreApi } from 'zustand/vanilla';
import type { CaseDefinition, Effect, GameState as CaseState, CaseTransitionResult } from '@lexicon/shared-types';
import { applyEffects, createCaseState } from '@lexicon/game-core';

export type GameStoreState = {
  caseDefinition: CaseDefinition;
  caseState: CaseState;
  nearby: { id: string; prompt: string } | null;
  paused: boolean;
  inputLocked: boolean;
  setNearby(n: { id: string; prompt: string } | null): void;
  togglePause(): void;
  setPaused(p: boolean): void;
  applyCaseEffects(effects: readonly Effect[]): CaseTransitionResult;
};

export type GameStore = StoreApi<GameStoreState>;

export function createGameStore(init: { caseDefinition: CaseDefinition }): GameStore {
  return createStore<GameStoreState>((set, get) => ({
    caseDefinition: init.caseDefinition,
    caseState: createCaseState(init.caseDefinition),
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
    applyCaseEffects(effects) {
      const state = get();
      const result = applyEffects(state.caseDefinition, state.caseState, effects);
      if (result.ok) set({ caseState: result.state });
      return result;
    },
  }));
}
