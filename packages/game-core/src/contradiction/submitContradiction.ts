import type { CaseDefinition, ContradictionResult, GameState } from '@lexicon/shared-types';
import { applyEffects } from '../effect/applyEffects';
import { reconcileDialogueProgress } from '../dialogue/reconcileDialogueProgress';

export function submitContradiction(
  definition: CaseDefinition,
  state: GameState,
  contradictionId: string,
  selectedFactIds: readonly string[],
): ContradictionResult {
  const contradiction = definition.contradictions.find((item) => item.id === contradictionId);
  if (!contradiction) {
    return { ok: false, state, error: { code: 'unknownContradiction', id: contradictionId } };
  }

  if (!contradiction.factIds.every((factId) => state.discoveredFactIds.includes(factId))) {
    return {
      ok: false,
      state,
      error: { code: 'contradictionUnavailable', id: contradictionId },
    };
  }

  for (const factId of selectedFactIds) {
    if (!definition.facts.some((fact) => fact.id === factId)) {
      return { ok: false, state, error: { code: 'unknownFact', id: factId } };
    }
    if (!state.discoveredFactIds.includes(factId)) {
      return { ok: false, state, error: { code: 'factNotDiscovered', id: factId } };
    }
  }

  const correct =
    selectedFactIds.length === 2 &&
    selectedFactIds[0] !== selectedFactIds[1] &&
    contradiction.factIds.every((factId) => selectedFactIds.includes(factId));
  if (!correct) return { ok: true, correct: false, state, events: [] };

  if (state.contradictionIds.includes(contradictionId)) {
    return { ok: true, correct: true, state, events: [] };
  }

  const applied = applyEffects(definition, state, [
    { type: 'setFlag', key: 'david_contradiction_found', value: true },
    { type: 'completeObjective', objectiveId: contradiction.objectiveId },
  ]);
  if (!applied.ok) return { ok: false, state, error: applied.error };

  // A finished comparison can be the last thing an objective was waiting for (for example the
  // conclusion). Objective activation is otherwise reconciled only after dialogue choices.
  const reconciled = reconcileDialogueProgress(definition, applied.state);
  if (!reconciled.ok) return { ok: false, state, error: reconciled.error };

  return {
    ok: true,
    correct: true,
    state: { ...reconciled.state, contradictionIds: [...state.contradictionIds, contradictionId] },
    events: [...applied.events, ...reconciled.events],
  };
}
