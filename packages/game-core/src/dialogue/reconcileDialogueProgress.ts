import type {
  CaseDefinition,
  CaseTransitionResult,
  Effect,
  GameState,
} from '@lexicon/shared-types';
import { applyEffects } from '../effect/applyEffects';
import { evaluateCondition } from '../condition/evaluateCondition';

/**
 * Completion and activation are authored in content: locked objectives whose
 * activationCondition holds become active before completions are evaluated.
 * Repeated reconciliation is idempotent.
 */
export function reconcileDialogueProgress(
  definition: CaseDefinition,
  state: GameState,
): CaseTransitionResult {
  const effects: Effect[] = definition.dialogues
    .filter(
      (tree) =>
        state.flags[tree.completionFlag] !== true &&
        evaluateCondition(state, tree.completionCondition),
    )
    .map((tree) => ({ type: 'setFlag', key: tree.completionFlag, value: true }));
  const interviews = applyEffects(definition, state, effects);
  if (!interviews.ok) return interviews;
  const activationEffects: Effect[] = definition.objectives
    .filter(
      (objective) =>
        interviews.state.objectiveStatuses[objective.id] === 'locked' &&
        objective.activationCondition &&
        evaluateCondition(interviews.state, objective.activationCondition),
    )
    .map((objective) => ({ type: 'activateObjective', objectiveId: objective.id }));
  const activated = applyEffects(definition, interviews.state, activationEffects);
  if (!activated.ok) return { ...activated, state };
  const objectiveEffects: Effect[] = definition.objectives
    .filter(
      (objective) =>
        activated.state.objectiveStatuses[objective.id] === 'active' &&
        objective.completionCondition &&
        evaluateCondition(activated.state, objective.completionCondition),
    )
    .map((objective) => ({ type: 'completeObjective', objectiveId: objective.id }));
  const completed = applyEffects(definition, activated.state, objectiveEffects);
  if (!completed.ok) return { ...completed, state };
  return {
    ok: true,
    state: completed.state,
    events: [...interviews.events, ...activated.events, ...completed.events],
  };
}
