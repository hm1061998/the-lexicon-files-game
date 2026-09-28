import { createStore, type StoreApi } from 'zustand/vanilla';
import type {
  CaseDefinition,
  Effect,
  GameState as CaseState,
  CaseTransitionResult,
} from '@lexicon/shared-types';
import { applyEffects, createCaseState } from '@lexicon/game-core';

export type NotebookTab = 'people' | 'evidence' | 'vocabulary';

export type GameStoreState = {
  caseDefinition: CaseDefinition;
  caseState: CaseState;
  nearby: { id: string; prompt: string } | null;
  paused: boolean;
  activeEvidenceId: string | null;
  notebookOpen: boolean;
  notebookTab: NotebookTab;
  inputLocked: boolean;
  persistenceError: string | null;
  setNearby(n: { id: string; prompt: string } | null): void;
  togglePause(): void;
  setPaused(p: boolean): void;
  openEvidence(id: string): void;
  closeEvidence(): void;
  toggleNotebook(): void;
  setNotebookTab(tab: NotebookTab): void;
  setPersistenceError(error: string | null): void;
  applyCaseEffects(effects: readonly Effect[]): CaseTransitionResult;
};

export type GameStore = StoreApi<GameStoreState>;

export function createGameStore(init: {
  caseDefinition: CaseDefinition;
  initialState?: CaseState;
  initialPersistenceError?: string;
}): GameStore {
  return createStore<GameStoreState>((set, get) => ({
    caseDefinition: init.caseDefinition,
    caseState: init.initialState ?? createCaseState(init.caseDefinition),
    nearby: null,
    paused: false,
    activeEvidenceId: null,
    notebookOpen: false,
    notebookTab: 'evidence',
    inputLocked: false,
    persistenceError: init.initialPersistenceError ?? null,
    setNearby(n) {
      set({ nearby: n });
    },
    togglePause() {
      set((state) => {
        const paused = !state.paused;
        return {
          paused,
          inputLocked: paused || state.activeEvidenceId !== null || state.notebookOpen,
        };
      });
    },
    setPaused(p) {
      set((state) => ({
        paused: p,
        inputLocked: p || state.activeEvidenceId !== null || state.notebookOpen,
      }));
    },
    openEvidence(id) {
      set((state) => {
        if (state.activeEvidenceId === id) return state;
        return { activeEvidenceId: id, inputLocked: true };
      });
    },
    closeEvidence() {
      set((state) => ({
        activeEvidenceId: null,
        inputLocked: state.paused || state.notebookOpen,
      }));
    },
    toggleNotebook() {
      set((state) => {
        const notebookOpen = !state.notebookOpen;
        return {
          notebookOpen,
          ...(notebookOpen ? { notebookTab: 'evidence' as const } : {}),
          inputLocked: state.paused || state.activeEvidenceId !== null || notebookOpen,
        };
      });
    },
    setNotebookTab(tab) {
      set((state) => (state.notebookTab === tab ? state : { notebookTab: tab }));
    },
    setPersistenceError(error) {
      set({ persistenceError: error });
    },
    applyCaseEffects(effects) {
      const state = get();
      const result = applyEffects(state.caseDefinition, state.caseState, effects);
      if (result.ok) set({ caseState: result.state });
      return result;
    },
  }));
}
