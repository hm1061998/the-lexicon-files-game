import type { CaseDefinition } from '@lexicon/shared-types';
import type { GameStore } from '../state/gameStore';

export type InteractionEligibilitySource = {
  isAvailable(sceneId: string, interactableId: string): boolean;
};

/** Hides one-shot evidence interactions after their evidence has been collected. */
export function createInteractionEligibilitySource(
  store: GameStore,
  definition: CaseDefinition,
): InteractionEligibilitySource {
  return {
    isAvailable(sceneId, interactableId) {
      const asset = definition.scenes
        .find((scene) => scene.id === sceneId)
        ?.assets.find((item) => item.id === interactableId);
      if (!asset?.interaction) return false;
      const evidenceIds = asset.interaction.effects
        ?.filter((effect) => effect.type === 'addEvidence')
        .map((effect) => effect.evidenceId);
      if (!evidenceIds?.length) return true;
      const collected = new Set(store.getState().caseState.evidenceIds);
      return !evidenceIds.some((evidenceId) => collected.has(evidenceId));
    },
  };
}
