import type { CaseSummary } from '@lexicon/shared-types';
import { parseCaseSummary } from '../schema/case';
import { ContentValidationError } from './ContentValidationError';
import case001 from '../../cases/case-001/case.json';
import case001Objectives from '../../cases/case-001/objectives.json';

const caseRegistry: Record<string, { case: Record<string, unknown>; objectives: unknown }> = {
  'case-001': {
    case: case001,
    objectives: case001Objectives,
  },
};

export function loadCaseSummary(caseId: string): CaseSummary {
  const entry = caseRegistry[caseId];
  if (!entry) {
    throw new ContentValidationError(`${caseId}/case.json`, [
      `no case registered for id "${caseId}"`,
    ]);
  }
  return parseCaseSummary(entry.case, entry.objectives, `${caseId}/case.json`);
}
