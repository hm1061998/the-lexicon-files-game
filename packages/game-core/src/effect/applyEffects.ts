import type {
  CaseDefinition,
  CaseDomainEvent,
  CaseEngineError,
  CaseTransitionResult,
  Effect,
  GameState,
  ObjectiveStatus,
} from '@lexicon/shared-types';
import { evaluateCondition } from '../condition/evaluateCondition';

type MutableState = {
  caseId: string;
  caseTitle: string;
  evidenceTotal: number;
  objectiveStatuses: Record<string, ObjectiveStatus>;
  evidenceIds: string[];
  discoveredFactIds: string[];
  flags: Record<string, boolean>;
};

function hasId(ids: readonly string[], id: string): boolean {
  return ids.includes(id);
}

function errorResult(state: GameState, error: CaseEngineError): CaseTransitionResult {
  return { ok: false, state, error };
}

function addFactIfUnlocked(
  definition: CaseDefinition,
  draft: MutableState,
  events: CaseDomainEvent[],
): boolean {
  let changed = false;
  for (const fact of definition.facts) {
    if (
      !hasId(draft.discoveredFactIds, fact.id) &&
      evaluateCondition(draft, fact.unlockCondition)
    ) {
      draft.discoveredFactIds.push(fact.id);
      events.push({ type: 'factUnlocked', factId: fact.id });
      changed = true;
    }
  }
  return changed;
}

export function applyEffects(
  definition: CaseDefinition,
  state: GameState,
  effects: readonly Effect[],
): CaseTransitionResult {
  const draft: MutableState = {
    ...state,
    objectiveStatuses: { ...state.objectiveStatuses },
    evidenceIds: [...state.evidenceIds],
    discoveredFactIds: [...state.discoveredFactIds],
    flags: { ...state.flags },
  };
  const events: CaseDomainEvent[] = [];

  for (const effect of effects) {
    switch (effect.type) {
      case 'addEvidence': {
        if (!definition.evidences.some((evidence) => evidence.id === effect.evidenceId)) {
          return errorResult(state, { code: 'unknownEvidence', id: effect.evidenceId });
        }
        if (!hasId(draft.evidenceIds, effect.evidenceId)) {
          draft.evidenceIds.push(effect.evidenceId);
          events.push({ type: 'evidenceAdded', evidenceId: effect.evidenceId });
        }
        break;
      }
      case 'unlockFact': {
        if (!definition.facts.some((fact) => fact.id === effect.factId)) {
          return errorResult(state, { code: 'unknownFact', id: effect.factId });
        }
        if (!hasId(draft.discoveredFactIds, effect.factId)) {
          draft.discoveredFactIds.push(effect.factId);
          events.push({ type: 'factUnlocked', factId: effect.factId });
        }
        break;
      }
      case 'setFlag': {
        if (draft.flags[effect.key] !== effect.value) {
          draft.flags[effect.key] = effect.value;
          events.push({ type: 'flagChanged', key: effect.key, value: effect.value });
        }
        break;
      }
      case 'activateObjective': {
        if (!Object.hasOwn(draft.objectiveStatuses, effect.objectiveId)) {
          return errorResult(state, { code: 'unknownObjective', id: effect.objectiveId });
        }
        const status = draft.objectiveStatuses[effect.objectiveId];
        if (status === 'completed') {
          return errorResult(state, {
            code: 'objectiveAlreadyCompleted',
            id: effect.objectiveId,
          });
        }
        if (status === 'locked') {
          draft.objectiveStatuses[effect.objectiveId] = 'active';
          events.push({ type: 'objectiveActivated', objectiveId: effect.objectiveId });
        }
        break;
      }
      case 'completeObjective': {
        if (!Object.hasOwn(draft.objectiveStatuses, effect.objectiveId)) {
          return errorResult(state, { code: 'unknownObjective', id: effect.objectiveId });
        }
        const status = draft.objectiveStatuses[effect.objectiveId];
        if (status === 'completed') {
          return errorResult(state, {
            code: 'objectiveAlreadyCompleted',
            id: effect.objectiveId,
          });
        }
        if (status !== 'active') {
          return errorResult(state, { code: 'objectiveNotActive', id: effect.objectiveId });
        }
        draft.objectiveStatuses[effect.objectiveId] = 'completed';
        events.push({ type: 'objectiveCompleted', objectiveId: effect.objectiveId });
        break;
      }
      default: {
        const exhaustive: never = effect;
        return exhaustive;
      }
    }
  }

  let changedFacts = false;
  do {
    changedFacts = addFactIfUnlocked(definition, draft, events);
  } while (changedFacts);

  if (events.length === 0) return { ok: true, state, events };
  return { ok: true, state: draft, events };
}
