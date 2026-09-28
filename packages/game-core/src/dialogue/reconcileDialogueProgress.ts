import type {
  CaseDefinition,
  CaseTransitionResult,
  Effect,
  GameState,
} from '@lexicon/shared-types';
import { applyEffects } from '../effect/applyEffects';
import { evaluateCondition } from '../condition/evaluateCondition';

/** Completion is authored in content; repeated reconciliation is idempotent. */
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
  const objectiveEffects: Effect[] = definition.objectives
    .filter(
      (objective) =>
        interviews.state.objectiveStatuses[objective.id] === 'active' &&
        objective.completionCondition &&
        evaluateCondition(interviews.state, objective.completionCondition),
    )
    .map((objective) => ({ type: 'completeObjective', objectiveId: objective.id }));
  const completed = applyEffects(definition, interviews.state, objectiveEffects);
  if (!completed.ok) return { ...completed, state };
  return { ok: true, state: completed.state, events: [...interviews.events, ...completed.events] };
}
