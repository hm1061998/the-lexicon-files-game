import type { CaseDefinition } from '@lexicon/shared-types';
import { ContentValidationError } from './ContentValidationError';
import { parseCaseDefinition } from '../schema/caseDefinition';
import case001 from '../../cases/case-001/case.json';
import case001Objectives from '../../cases/case-001/objectives.json';
import case001Evidences from '../../cases/case-001/evidences.json';
import case001Facts from '../../cases/case-001/facts.json';
import case001MainOffice from '../../cases/case-001/scenes/main_office.json';

type RegisteredCase = {
  case: unknown;
  objectives: unknown;
  evidences: unknown;
  facts: unknown;
  scenes: readonly unknown[];
};

const caseRegistry: Record<string, RegisteredCase> = {
  'case-001': {
    case: case001,
    objectives: case001Objectives,
    evidences: case001Evidences,
    facts: case001Facts,
    scenes: [case001MainOffice],
  },
};

export function loadCaseDefinition(caseId: string): CaseDefinition {
  const entry = caseRegistry[caseId];
  if (!entry) {
    throw new ContentValidationError(`${caseId}/case.json`, [
      `no case registered for id "${caseId}"`,
    ]);
  }

  return parseCaseDefinition(
    {
      caseRaw: entry.case,
      objectivesRaw: entry.objectives,
      evidencesRaw: entry.evidences,
      factsRaw: entry.facts,
      sceneRaws: entry.scenes,
    },
    `cases/${caseId}`,
  );
}
