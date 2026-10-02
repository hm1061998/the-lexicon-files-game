import type { CaseDifficulty } from '@lexicon/shared-types';
import { loadCaseDefinition, REGISTERED_CASE_IDS } from './loadCaseDefinition';

export type CaseCatalogueEntry = {
  readonly id: string;
  readonly title: string;
  readonly difficulty: CaseDifficulty;
  readonly stats: {
    readonly suspects: number;
    readonly clues: number;
    readonly contradictions: number;
    readonly scenes: number;
  };
};

export function listCaseCatalogue(): readonly CaseCatalogueEntry[] {
  return REGISTERED_CASE_IDS.map((id) => {
    const definition = loadCaseDefinition(id);
    return {
      id: definition.id,
      title: definition.title,
      difficulty: definition.difficulty,
      stats: {
        suspects: definition.conclusion?.suspectNpcIds.length ?? 0,
        clues: definition.evidenceTotal,
        contradictions: definition.contradictions.length,
        scenes: definition.scenes.length,
      },
    };
  });
}
