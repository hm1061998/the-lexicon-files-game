import type { CaseDefinition } from '@lexicon/shared-types';
import { ContentValidationError } from './ContentValidationError';
import { parseCaseDefinition } from '../schema/caseDefinition';
import case001 from '../../cases/case-001/case.json';
import case001Objectives from '../../cases/case-001/objectives.json';
import case001Evidences from '../../cases/case-001/evidences.json';
import case001Facts from '../../cases/case-001/facts.json';
import case001Contradictions from '../../cases/case-001/contradictions.json';
import case001ListeningTasks from '../../cases/case-001/listening-tasks.json';
import case001MainOffice from '../../cases/case-001/scenes/main_office.json';
import case001Archive from '../../cases/case-001/scenes/archive.json';

import case001Npcs from '../../cases/case-001/npcs.json';
import case001Dialogues from '../../cases/case-001/dialogues.json';
import case001Vocabulary from '../../cases/case-001/vocabulary.json';
import case002 from '../../cases/case-002/case.json';
import case002Objectives from '../../cases/case-002/objectives.json';
import case002Evidences from '../../cases/case-002/evidences.json';
import case002Facts from '../../cases/case-002/facts.json';
import case002Contradictions from '../../cases/case-002/contradictions.json';
import case002ListeningTasks from '../../cases/case-002/listening-tasks.json';
import case002Npcs from '../../cases/case-002/npcs.json';
import case002Dialogues from '../../cases/case-002/dialogues.json';
import case002Vocabulary from '../../cases/case-002/vocabulary.json';
import case002MainOffice from '../../cases/case-002/scenes/main_office.json';
import case002MailRoom from '../../cases/case-002/scenes/mail_room.json';
import case002Reception from '../../cases/case-002/scenes/reception.json';

type RegisteredCase = {
  case: unknown;
  objectives: unknown;
  evidences: unknown;
  facts: unknown;
  contradictions: unknown;
  listeningTasks: unknown;
  npcs: unknown;
  dialogues: unknown;
  vocabulary: unknown;
  scenes: readonly unknown[];
};

const caseRegistry: Record<string, RegisteredCase> = {
  'case-001': {
    case: case001,
    objectives: case001Objectives,
    evidences: case001Evidences,
    facts: case001Facts,
    contradictions: case001Contradictions,
    listeningTasks: case001ListeningTasks,
    npcs: case001Npcs,
    dialogues: case001Dialogues,
    vocabulary: case001Vocabulary,
    scenes: [case001MainOffice, case001Archive],
  },
  'case-002': {
    case: case002,
    objectives: case002Objectives,
    evidences: case002Evidences,
    facts: case002Facts,
    contradictions: case002Contradictions,
    listeningTasks: case002ListeningTasks,
    npcs: case002Npcs,
    dialogues: case002Dialogues,
    vocabulary: case002Vocabulary,
    scenes: [case002MainOffice, case002MailRoom, case002Reception],
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
      contradictionsRaw: entry.contradictions,
      listeningTasksRaw: entry.listeningTasks,
      npcsRaw: entry.npcs,
      dialoguesRaw: entry.dialogues,
      vocabularyRaw: entry.vocabulary,
      sceneRaws: entry.scenes,
    },
    `cases/${caseId}`,
  );
}

export const REGISTERED_CASE_IDS: readonly string[] = Object.keys(caseRegistry);
