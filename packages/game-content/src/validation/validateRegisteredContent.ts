import { loadCaseDefinition, REGISTERED_CASE_IDS } from '../loader/loadCaseDefinition';
import { loadUiStrings } from '../loader/loadUiStrings';
export function validateRegisteredContent(
  loadCase = loadCaseDefinition,
  loadStrings = loadUiStrings,
): void {
  for (const id of REGISTERED_CASE_IDS) loadCase(id);
  loadStrings('vi');
}
