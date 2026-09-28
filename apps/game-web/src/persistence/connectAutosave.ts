import type { GameState } from '@lexicon/shared-types';
import type { GameStore } from '../state/gameStore';

export function connectAutosave(
  store: GameStore,
  saveGameState: (state: GameState) => Promise<void>,
  onError: (error: unknown) => void,
): () => void {
  let active = true;
  let saveQueue = Promise.resolve();

  const unsubscribe = store.subscribe((state, previous) => {
    if (state.caseState === previous.caseState) return;
    const snapshot = state.caseState;

    saveQueue = saveQueue.then(async () => {
      if (!active) return;
      try {
        await saveGameState(snapshot);
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
