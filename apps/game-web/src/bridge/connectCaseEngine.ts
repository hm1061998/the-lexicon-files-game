import type { CaseDefinition, EventBus, GameEventMap } from '@lexicon/shared-types';
import type { GameStore } from '../state/gameStore';

/** Resolves interaction IDs to content-authored effects and applies them through the case store. */
export function connectCaseEngine(
  bus: EventBus<GameEventMap>,
  store: GameStore,
  definition: CaseDefinition,
): () => void {
  return bus.on('interaction:triggered', ({ interactableId }) => {
    const interaction = definition.scenes
      .flatMap((scene) => scene.assets)
      .find((asset) => asset.id === interactableId)?.interaction;
    if (interaction?.effects?.length) {
      const result = store.getState().applyCaseEffects(interaction.effects);
      if (!result.ok) return;
      for (const event of result.events) {
        if (event.type === 'evidenceAdded') store.getState().openEvidence(event.evidenceId);
      }
    }
  });
}
