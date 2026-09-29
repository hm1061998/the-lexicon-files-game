import { createStore, type StoreApi } from 'zustand/vanilla';
import type {
  CaseDefinition,
  Effect,
  GameState as CaseState,
  CaseTransitionResult,
  DialogueSession,
  DialogueAction,
  ListeningAnswerResult,
  TimelinePlacementResult,
  ContradictionResult,
} from '@lexicon/shared-types';
import {
  applyEffects,
  createCaseState,
  startDialogue as runStartDialogue,
  chooseDialogueChoice,
  answerListeningTask as answerListeningTaskCore,
  placeTimelineEvent as placeTimelineEventCore,
  submitContradiction as submitContradictionCore,
} from '@lexicon/game-core';
export type NotebookTab = 'people' | 'evidence' | 'vocabulary' | 'timeline';
export type GameStoreState = {
  caseDefinition: CaseDefinition;
  caseState: CaseState;
  activeSceneId: string;
  nearby: { id: string; prompt: string } | null;
  paused: boolean;
  activeEvidenceId: string | null;
  notebookOpen: boolean;
  notebookTab: NotebookTab;
  dialogueSession: DialogueSession | null;
  dialogueError: string | null;
  inputLocked: boolean;
  persistenceError: string | null;
  setNearby(n: { id: string; prompt: string } | null): void;
  togglePause(): void;
  setPaused(p: boolean): void;
  openEvidence(id: string): void;
  closeEvidence(): void;
  toggleNotebook(): void;
  setNotebookTab(tab: NotebookTab): void;
  startDialogue(npcId: string): void;
  chooseDialogue(action: DialogueAction): void;
  closeDialogue(): void;
  setPersistenceError(error: string | null): void;
  applyCaseEffects(effects: readonly Effect[]): CaseTransitionResult;
  answerListeningTask(taskId: string, optionId: string): ListeningAnswerResult;
  placeTimelineEvent(eventId: string, slotId: string): TimelinePlacementResult;
  submitContradiction(contradictionId: string, factIds: readonly string[]): ContradictionResult;
  transitionScene(sceneId: string, spawnId: string): boolean;
};
export type GameStore = StoreApi<GameStoreState>;
function inputLocked(
  s: Pick<GameStoreState, 'paused' | 'activeEvidenceId' | 'notebookOpen' | 'dialogueSession'>,
): boolean {
  return s.paused || s.activeEvidenceId !== null || s.notebookOpen || s.dialogueSession !== null;
}
export function createGameStore(init: {
  caseDefinition: CaseDefinition;
  initialState?: CaseState;
  initialPersistenceError?: string;
  initialSceneId?: string;
}): GameStore {
  const initialSceneId = init.initialSceneId ?? init.caseDefinition.scenes[0]?.id;
  const initialScene = init.caseDefinition.scenes.find(({ id }) => id === initialSceneId);
  if (!initialScene || !initialScene.spawnPoints.default)
    throw new Error(`Initial scene "${String(initialSceneId)}" or its default spawn is missing`);
  // Per-store action sequence also rejects callbacks from a closed/reopened session.
  let nextRevision = 0;
  return createStore<GameStoreState>((set, get) => ({
    caseDefinition: init.caseDefinition,
    caseState: init.initialState ?? createCaseState(init.caseDefinition),
    activeSceneId: initialScene.id,
    nearby: null,
    paused: false,
    activeEvidenceId: null,
    notebookOpen: false,
    notebookTab: 'evidence',
    dialogueSession: null,
    dialogueError: null,
    inputLocked: false,
    persistenceError: init.initialPersistenceError ?? null,
    setNearby(nearby) {
      set({ nearby });
    },
    togglePause() {
      get().setPaused(!get().paused);
    },
    setPaused(paused) {
      set((s) => {
        if (paused && (s.dialogueSession || s.activeEvidenceId || s.notebookOpen)) return s;
        return { paused, inputLocked: inputLocked({ ...s, paused }) };
      });
    },
    openEvidence(id) {
      set((s) => {
        if (s.activeEvidenceId === id || s.inputLocked) return s;
        return { activeEvidenceId: id, inputLocked: true };
      });
    },
    closeEvidence() {
      set((s) => ({
        activeEvidenceId: null,
        inputLocked: inputLocked({ ...s, activeEvidenceId: null }),
      }));
    },
    toggleNotebook() {
      set((s) => {
        if (s.paused || s.activeEvidenceId || s.dialogueSession) return s;
        const notebookOpen = !s.notebookOpen;
        return {
          notebookOpen,
          ...(notebookOpen ? { notebookTab: 'evidence' as const } : {}),
          inputLocked: inputLocked({ ...s, notebookOpen }),
        };
      });
    },
    setNotebookTab(notebookTab) {
      set((s) => (s.notebookTab === notebookTab ? s : { notebookTab }));
    },
    startDialogue(npcId) {
      const s = get();
      if (s.inputLocked) return;
      const r = runStartDialogue(s.caseDefinition, s.caseState, npcId);
      if (!r.ok) {
        set({ dialogueError: `${r.error.code}: ${r.error.detail}` });
        return;
      }
      const dialogueSession = { ...r.session, revision: nextRevision++ };
      set({ caseState: r.state, dialogueSession, dialogueError: null, inputLocked: true });
    },
    chooseDialogue(action) {
      const s = get();
      if (!s.dialogueSession) return;
      const r = chooseDialogueChoice(s.caseDefinition, s.caseState, s.dialogueSession, action);
      if (!r.ok) {
        if (r.error.code === 'staleAction') return;
        const detail = `${r.error.code}: ${r.error.detail}`;
        if (import.meta.env.DEV) console.error('[Dialogue]', detail);
        set({ dialogueError: detail });
        return;
      }
      nextRevision = r.session.revision + 1;
      set({ caseState: r.state, dialogueSession: r.session, dialogueError: null });
    },
    closeDialogue() {
      set((s) => ({
        dialogueSession: null,
        dialogueError: null,
        inputLocked: inputLocked({ ...s, dialogueSession: null }),
      }));
    },
    setPersistenceError(persistenceError) {
      set({ persistenceError });
    },
    applyCaseEffects(effects) {
      const s = get();
      const r = applyEffects(s.caseDefinition, s.caseState, effects);
      if (r.ok) set({ caseState: r.state });
      return r;
    },
    answerListeningTask(taskId, optionId) {
      const s = get();
      const result = answerListeningTaskCore(s.caseDefinition, s.caseState, taskId, optionId);
      if (result.ok && result.correct) set({ caseState: result.state });
      return result;
    },
    placeTimelineEvent(eventId, slotId) {
      const s = get();
      const result = placeTimelineEventCore(s.caseDefinition, s.caseState, eventId, slotId);
      if (result.ok && result.correct) set({ caseState: result.state });
      return result;
    },
    submitContradiction(contradictionId, factIds) {
      const s = get();
      const result = submitContradictionCore(
        s.caseDefinition,
        s.caseState,
        contradictionId,
        factIds,
      );
      if (result.ok && result.correct) set({ caseState: result.state });
      return result;
    },
    transitionScene(sceneId, spawnId) {
      const scene = get().caseDefinition.scenes.find(({ id }) => id === sceneId);
      if (!scene || !scene.spawnPoints[spawnId]) return false;
      if (get().activeSceneId !== sceneId) set({ activeSceneId: sceneId });
      return true;
    },
  }));
}
