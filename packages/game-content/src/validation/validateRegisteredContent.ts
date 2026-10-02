import { loadCaseDefinition, REGISTERED_CASE_IDS } from '../loader/loadCaseDefinition';
import { loadUiStrings } from '../loader/loadUiStrings';
import { ContentValidationError } from '../loader/ContentValidationError';
export function validateRegisteredContent(
  loadCase = loadCaseDefinition,
  loadStrings = loadUiStrings,
): void {
  const recommendedCaseIds: string[] = [];
  for (const id of REGISTERED_CASE_IDS) {
    if (loadCase(id).difficulty.recommendedForNewPlayers) recommendedCaseIds.push(id);
  }
  if (recommendedCaseIds.length > 1) {
    throw new ContentValidationError('registered cases', [
      `difficulty.recommendedForNewPlayers: at most one case may be recommended (${recommendedCaseIds.join(', ')})`,
    ]);
  }
  loadStrings('vi');
}
