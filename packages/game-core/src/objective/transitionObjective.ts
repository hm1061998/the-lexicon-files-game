import type { CaseDefinition, CaseTransitionResult, GameState } from '@lexicon/shared-types';
import { applyEffects } from '../effect/applyEffects';

export function activateObjective(
  definition: CaseDefinition,
  state: GameState,
  objectiveId: string,
): CaseTransitionResult {
  return applyEffects(definition, state, [{ type: 'activateObjective', objectiveId }]);
}

export function completeObjective(
  definition: CaseDefinition,
  state: GameState,
  objectiveId: string,
): CaseTransitionResult {
  return applyEffects(definition, state, [{ type: 'completeObjective', objectiveId }]);
}
