import { evaluateCondition } from '@lexicon/game-core';
import type { CaseDefinition } from '@lexicon/shared-types';
import type { GameStore } from '../state/gameStore';

export type WorldCueSource = { visibleIds(sceneId: string): ReadonlySet<string> };

export function createWorldCueSource(store: GameStore, definition: CaseDefinition): WorldCueSource {
  return {
    visibleIds(sceneId) {
      const state = store.getState();
      const scene = definition.scenes.find((item) => item.id === sceneId);
      if (!scene) return new Set();
      return new Set(
        scene.assets.flatMap((asset) => {
          const cue = asset.cue;
          if (!cue || (cue.visibleWhen && !evaluateCondition(state.caseState, cue.visibleWhen)))
            return [];
          if (cue.kind === 'evidence' && state.caseState.evidenceIds.includes(cue.evidenceId))
            return [];
          return [asset.id];
        }),
      );
    },
  };
}
