import type { CaseDefinition, GameState, ObjectiveStatus } from '@lexicon/shared-types';

export function createCaseState(definition: CaseDefinition): GameState {
  const objectiveStatuses: Record<string, ObjectiveStatus> = {};
  for (const objective of definition.objectives) {
    objectiveStatuses[objective.id] =
      objective.id === definition.initialObjectiveId
        ? 'active'
        : (objective.initialStatus ?? 'locked');
  }

  return {
    caseId: definition.id,
    caseTitle: definition.title,
    evidenceTotal: definition.evidenceTotal,
    objectiveStatuses,
    evidenceIds: [],
    discoveredFactIds: [],
    flags: {},
  };
}
