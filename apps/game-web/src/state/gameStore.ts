import {
  createNotebookReadingState,
  selectNotebookReading,
  type NotebookReadingState,
} from '../notebook/notebookReadingState';
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
  AccusationResult,
} from '@lexicon/shared-types';
import {
  applyEffects,
  createCaseState,
  startDialogue as runStartDialogue,
  chooseDialogueChoice,
  answerListeningTask as answerListeningTaskCore,
  placeTimelineEvent as placeTimelineEventCore,
  submitContradiction as submitContradictionCore,
  submitAccusation as submitAccusationCore,
} from '@lexicon/game-core';
export type NotebookTab = 'people' | 'evidence' | 'vocabulary' | 'timeline';
export type GameStoreState = {
  caseDefinition: CaseDefinition;
  caseState: CaseState;
  activeSceneId: string;
  nearby: { id: string; prompt: string } | null;
  /** Screen anchor (canvas-relative CSS px) of the nearby target, published by Phaser. */
  interactionAnchor: {
    x: number;
    y: number;
    avoidRects?: readonly { left: number; top: number; right: number; bottom: number }[];
  } | null;
  /** Published view of the Phaser player position (Phaser stays the source); null until known. */
  playerPosition: { x: number; y: number; coordinateSpace?: 'screen' | 'logical' } | null;
  /** HUD-only visibility of the minimap; deliberately not saved or in settings. */
  minimapVisible: boolean;
  /** HUD-only visibility of the active objective; deliberately not saved. */
  objectiveVisible: boolean;
  paused: boolean;
  activeEvidenceId: string | null;
  notebookOpen: boolean;
  deductionOpen: boolean;
  notebookTab: NotebookTab;
  notebookReading: NotebookReadingState;
  setNotebookReading(reading: NotebookReadingState): void;
  dialogueSession: DialogueSession | null;
  dialogueError: string | null;
  inputLocked: boolean;
  persistenceError: string | null;
  setNearby(n: { id: string; prompt: string } | null): void;
  setInteractionAnchor(anchor: { x: number; y: number } | null): void;
  setPlayerPosition(position: { x: number; y: number } | null): void;
  /** Toggles the minimap; no-op while input is locked (pause, modal, closed case). */
  toggleMinimap(): void;
  toggleObjective(): void;
  togglePause(): void;
  setPaused(p: boolean): void;
  openEvidence(id: string): void;
  closeEvidence(): void;
  /** Reopens an already-collected evidence from the notebook; never changes case state. */
  reviewEvidence(id: string): void;
  toggleNotebook(): void;
  openNotebook(): void;
  openDeduction(): void;
  toggleDeduction(): void;
  closeDeduction(): void;
  setNotebookTab(tab: NotebookTab): void;
  startDialogue(npcId: string): boolean;
  chooseDialogue(action: DialogueAction): void;
  closeDialogue(): void;
  setPersistenceError(error: string | null): void;
  applyCaseEffects(effects: readonly Effect[]): CaseTransitionResult;
  answerListeningTask(taskId: string, optionId: string): ListeningAnswerResult;
  placeTimelineEvent(eventId: string, slotId: string): TimelinePlacementResult;
  submitContradiction(contradictionId: string, factIds: readonly string[]): ContradictionResult;
  submitAccusation(suspectNpcId: string): AccusationResult;
  transitionScene(sceneId: string, spawnId: string): boolean;
};
export type GameStore = StoreApi<GameStoreState>;
/** The report replaces play once the case is closed; no further investigation. */
function caseClosed(s: Pick<GameStoreState, 'caseState'>): boolean {
  return s.caseState.flags.case_closed === true;
}
function inputLocked(
  s: Pick<
    GameStoreState,
    | 'paused'
    | 'activeEvidenceId'
    | 'notebookOpen'
    | 'deductionOpen'
    | 'dialogueSession'
    | 'caseState'
  >,
): boolean {
  return (
    s.paused ||
    s.activeEvidenceId !== null ||
    s.notebookOpen ||
    s.deductionOpen ||
    s.dialogueSession !== null ||
    caseClosed(s)
  );
}
export function createGameStore(init: {
  caseDefinition: CaseDefinition;
  initialState?: CaseState;
  initialPersistenceError?: string;
  initialSceneId?: string;
  initialHudVisibility?: { minimapVisible: boolean; objectiveVisible: boolean };
}): GameStore {
  const initialSceneId = init.initialSceneId ?? init.caseDefinition.scenes[0]?.id;
  const initialScene = init.caseDefinition.scenes.find(({ id }) => id === initialSceneId);
  if (!initialScene || !initialScene.spawnPoints.default)
    throw new Error(`Initial scene "${String(initialSceneId)}" or its default spawn is missing`);
  // Per-store action sequence also rejects callbacks from a closed/reopened session.
  let nextRevision = 0;
  const initialCaseState = init.initialState ?? createCaseState(init.caseDefinition);
  return createStore<GameStoreState>((set, get) => ({
    caseDefinition: init.caseDefinition,
    caseState: initialCaseState,
    activeSceneId: initialScene.id,
    nearby: null,
    interactionAnchor: null,
    playerPosition: null,
    minimapVisible: init.initialHudVisibility?.minimapVisible ?? true,
    objectiveVisible: init.initialHudVisibility?.objectiveVisible ?? true,
    paused: false,
    activeEvidenceId: null,
    notebookOpen: false,
    deductionOpen: false,
    notebookTab: 'evidence',
    notebookReading: createNotebookReadingState(init.caseDefinition.id),
    setNotebookReading: (reading) =>
      set((state) => ({
        notebookReading: selectNotebookReading(reading, state.caseDefinition.id),
      })),
    dialogueSession: null,
    dialogueError: null,
    // A closed case never resumes free movement; the report replaces play.
    inputLocked: initialCaseState.flags.case_closed === true,
    persistenceError: init.initialPersistenceError ?? null,
    setNearby(nearby) {
      set({ nearby });
    },
    setInteractionAnchor(interactionAnchor) {
      set({ interactionAnchor });
    },
    setPlayerPosition(playerPosition) {
      set({ playerPosition });
    },
    toggleMinimap() {
      set((s) => (s.inputLocked ? s : { minimapVisible: !s.minimapVisible }));
    },
    toggleObjective() {
      set((s) => (s.inputLocked ? s : { objectiveVisible: !s.objectiveVisible }));
    },
    togglePause() {
      get().setPaused(!get().paused);
    },
    setPaused(paused) {
      set((s) => {
        if (
          paused &&
          (s.dialogueSession ||
            s.activeEvidenceId ||
            s.notebookOpen ||
            s.deductionOpen ||
            caseClosed(s))
        )
          return s;
        return { paused, inputLocked: inputLocked({ ...s, paused }) };
      });
    },
    openEvidence(id) {
      set((s) => {
        if (s.activeEvidenceId === id || s.inputLocked) return s;
        return { activeEvidenceId: id, inputLocked: true };
      });
    },
    reviewEvidence(id) {
      set((s) => {
        if (!s.caseState.evidenceIds.includes(id) || caseClosed(s)) return s;
        if (s.paused || s.dialogueSession || s.activeEvidenceId) return s;
        return {
          notebookOpen: false,
          deductionOpen: false,
          activeEvidenceId: id,
          inputLocked: true,
        };
      });
    },
    closeEvidence() {
      set((s) => ({
        activeEvidenceId: null,
        inputLocked: inputLocked({ ...s, activeEvidenceId: null }),
      }));
    },
    openNotebook() {
      const s = get();
      if (s.paused || s.activeEvidenceId || s.dialogueSession || caseClosed(s)) return;
      set({ notebookOpen: true, deductionOpen: false, inputLocked: true });
    },
    openDeduction() {
      const s = get();
      if (s.paused || s.activeEvidenceId || s.dialogueSession || caseClosed(s)) return;
      set({ deductionOpen: true, notebookOpen: false, inputLocked: true });
    },
    toggleNotebook() {
      const s = get();
      if (s.notebookOpen)
        set({ notebookOpen: false, inputLocked: inputLocked({ ...s, notebookOpen: false }) });
      else s.openNotebook();
    },
    toggleDeduction() {
      const s = get();
      if (s.deductionOpen) s.closeDeduction();
      else s.openDeduction();
    },
    closeDeduction() {
      set((s) => ({
        deductionOpen: false,
        inputLocked: inputLocked({ ...s, deductionOpen: false }),
      }));
    },
    setNotebookTab(notebookTab) {
      set((s) => (s.notebookTab === notebookTab ? s : { notebookTab }));
    },
    startDialogue(npcId) {
      const s = get();
      if (s.inputLocked) return false;
      const r = runStartDialogue(s.caseDefinition, s.caseState, npcId);
      if (!r.ok) {
        set({ dialogueError: `${r.error.code}: ${r.error.detail}` });
        return false;
      }
      const dialogueSession = { ...r.session, revision: nextRevision++ };
      set({ caseState: r.state, dialogueSession, dialogueError: null, inputLocked: true });
      return true;
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
      if (r.ok && !caseClosed(s)) set({ caseState: r.state });
      return r;
    },
    answerListeningTask(taskId, optionId) {
      const s = get();
      const result = answerListeningTaskCore(s.caseDefinition, s.caseState, taskId, optionId);
      if (result.ok && result.correct && !caseClosed(s)) set({ caseState: result.state });
      return result;
    },
    placeTimelineEvent(eventId, slotId) {
      const s = get();
      const result = placeTimelineEventCore(s.caseDefinition, s.caseState, eventId, slotId);
      if (result.ok && result.correct && !caseClosed(s)) set({ caseState: result.state });
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
      if (result.ok && result.correct && !caseClosed(s)) set({ caseState: result.state });
      return result;
    },
    submitAccusation(suspectNpcId) {
      const s = get();
      const result = submitAccusationCore(s.caseDefinition, s.caseState, suspectNpcId);
      // Wrong or rejected accusations leave the case state untouched.
      if (result.ok && result.correct && result.state !== s.caseState) {
        set({
          caseState: result.state,
          notebookOpen: false,
          deductionOpen: false,
          notebookTab: 'evidence',
          inputLocked: inputLocked({
            ...s,
            notebookOpen: false,
            deductionOpen: false,
            caseState: result.state,
          }),
        });
      }
      return result;
    },
    transitionScene(sceneId, spawnId) {
      const scene = get().caseDefinition.scenes.find(({ id }) => id === sceneId);
      if (!scene || !scene.spawnPoints[spawnId]) return false;
      if (get().activeSceneId !== sceneId)
        set({ activeSceneId: sceneId, playerPosition: null, interactionAnchor: null });
      return true;
    },
  }));
}
