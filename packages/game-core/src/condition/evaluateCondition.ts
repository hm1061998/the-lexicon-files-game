import type { Condition, GameState } from '@lexicon/shared-types';

export function evaluateCondition(state: GameState, condition: Condition): boolean {
  switch (condition.type) {
    case 'hasEvidence':
      return state.evidenceIds.includes(condition.evidenceId);
    case 'hasFact':
      return state.discoveredFactIds.includes(condition.factId);
    case 'objectiveCompleted':
      return state.objectiveStatuses[condition.objectiveId] === 'completed';
    case 'flag':
      return state.flags[condition.key] === condition.value;
    case 'all':
      return condition.conditions.every((child) => evaluateCondition(state, child));
    case 'any':
      return condition.conditions.some((child) => evaluateCondition(state, child));
    default: {
      const exhaustive: never = condition;
      return exhaustive;
    }
  }
}
