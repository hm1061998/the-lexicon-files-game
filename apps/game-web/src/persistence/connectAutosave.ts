import type { GameState } from '@lexicon/shared-types';
import type { GameStore } from '../state/gameStore';

export function connectAutosave(
  store: GameStore,
  saveGameState: (state: GameState, activeSceneId: string) => Promise<void>,
  onError: (error: unknown) => void,
): () => void {
  let active = true;
  let saveQueue = Promise.resolve();

  const unsubscribe = store.subscribe((state, previous) => {
    if (state.caseState === previous.caseState && state.activeSceneId === previous.activeSceneId)
      return;
    const snapshot = state.caseState;
    const activeSceneId = state.activeSceneId;

    saveQueue = saveQueue.then(async () => {
      if (!active) return;
      try {
        await saveGameState(snapshot, activeSceneId);
      } catch (error) {
        onError(error);
      }
    });
  });

  return () => {
    active = false;
    unsubscribe();
  };
}
