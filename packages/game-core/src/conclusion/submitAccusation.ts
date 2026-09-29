import type { AccusationResult, CaseDefinition, GameState } from '@lexicon/shared-types';
import { applyEffects } from '../effect/applyEffects';

const CASE_CLOSED_FLAG = 'case_closed';

/**
 * Pure final-accusation transition. A wrong suspect returns the input state
 * untouched (no penalty, retry allowed); the correct suspect completes the
 * conclusion objective and closes the case. Resubmitting the correct suspect
 * after closing is idempotent.
 */
export function submitAccusation(
  definition: CaseDefinition,
  state: GameState,
  suspectNpcId: string,
): AccusationResult {
  const conclusion = definition.conclusion;
  if (!conclusion || !conclusion.suspectNpcIds.includes(suspectNpcId)) {
    return { ok: false, state, error: { code: 'unknownSuspect', id: suspectNpcId } };
  }
  const correct = suspectNpcId === conclusion.correctSuspectNpcId;

  if (state.flags[CASE_CLOSED_FLAG] === true) {
    if (correct) return { ok: true, correct: true, state, events: [] };
    return { ok: false, state, error: { code: 'caseAlreadyClosed', id: definition.id } };
  }

  if (state.objectiveStatuses[conclusion.objectiveId] !== 'active') {
    return {
      ok: false,
      state,
      error: { code: 'objectiveNotActive', id: conclusion.objectiveId },
    };
  }

  if (!correct) return { ok: true, correct: false, state, events: [] };

  const applied = applyEffects(definition, state, [
    { type: 'completeObjective', objectiveId: conclusion.objectiveId },
    { type: 'setFlag', key: CASE_CLOSED_FLAG, value: true },
  ]);
  if (!applied.ok) return { ok: false, state, error: applied.error };
  return { ok: true, correct: true, state: applied.state, events: applied.events };
}
