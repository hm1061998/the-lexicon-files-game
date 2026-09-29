import type {
  CaseDefinition,
  GameState,
  ListeningAnswerResult,
} from '@lexicon/shared-types';
import { applyEffects } from '../effect/applyEffects';

export function answerListeningTask(
  definition: CaseDefinition,
  state: GameState,
  taskId: string,
  optionId: string,
): ListeningAnswerResult {
  const task = definition.listeningTasks.find((entry) => entry.id === taskId);
  if (!task) {
    return { ok: false, state, error: { code: 'unknownListeningTask', id: taskId } };
  }
  if (!task.options.some((option) => option.id === optionId)) {
    return { ok: false, state, error: { code: 'unknownListeningOption', id: optionId } };
  }
  if (optionId !== task.correctOptionId) {
    return { ok: true, correct: false, state, events: [] };
  }

  const result = applyEffects(definition, state, task.correctEffects);
  return result.ok
    ? { ok: true, correct: true, state: result.state, events: result.events }
    : { ok: false, state, error: result.error };
}
