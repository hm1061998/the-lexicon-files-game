import type { EventBus, GameEventMap } from '@lexicon/shared-types';
import type { GameStore } from '../state/gameStore';

/** Syncs bus interaction events into the store. Returns an unsubscribe function. */
export function connectBusToStore(bus: EventBus<GameEventMap>, store: GameStore): () => void {
  const offNearby = bus.on('interaction:nearby', ({ interactableId, prompt }) => {
    store.getState().setNearby({ id: interactableId, prompt });
  });
  const offCleared = bus.on('interaction:cleared', () => {
    store.getState().setNearby(null);
  });
  const offTransition = bus.on('scene:transitionRequested', () => {
    store.getState().setNearby(null);
  });

  return () => {
    offNearby();
    offCleared();
    offTransition();
  };
}
