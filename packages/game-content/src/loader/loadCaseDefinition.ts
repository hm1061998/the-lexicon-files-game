import type { CaseDefinition } from '@lexicon/shared-types';
import { ContentValidationError } from './ContentValidationError';
import { parseCaseDefinition } from '../schema/caseDefinition';
import case001 from '../../cases/case-001/case.json';
import case001Objectives from '../../cases/case-001/objectives.json';
import case001Evidences from '../../cases/case-001/evidences.json';
import case001Facts from '../../cases/case-001/facts.json';
import case001MainOffice from '../../cases/case-001/scenes/main_office.json';

import case001Npcs from '../../cases/case-001/npcs.json';
import case001Dialogues from '../../cases/case-001/dialogues.json';

type RegisteredCase = {
  case: unknown;
  objectives: unknown;
  evidences: unknown;
  facts: unknown;
  npcs: unknown;
  dialogues: unknown;
  scenes: readonly unknown[];
};

const caseRegistry: Record<string, RegisteredCase> = {
  'case-001': {
    case: case001,
    objectives: case001Objectives,
    evidences: case001Evidences,
    facts: case001Facts,
    npcs: case001Npcs,
    dialogues: case001Dialogues,
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
      npcsRaw: entry.npcs,
      dialoguesRaw: entry.dialogues,
      sceneRaws: entry.scenes,
    },
    `cases/${caseId}`,
  );
}

export const REGISTERED_CASE_IDS: readonly string[] = Object.keys(caseRegistry);
