import type { UiStrings } from '@lexicon/shared-types';
import type { CaseCatalogueEntry } from '@lexicon/game-content';

export type CaseCardModel = {
  id: string;
  title: string;
  tierLabel: string;
  cefrLabel: string;
  minutesLabel: string;
  summary: string;
  recommended: boolean;
  stats: readonly { label: string; value: number }[];
};

export function selectCaseCards(
  catalogue: readonly CaseCatalogueEntry[],
  strings: UiStrings,
): CaseCardModel[] {
  const tiers = {
    easy: strings.caseTierEasy,
    medium: strings.caseTierMedium,
    hard: strings.caseTierHard,
  } as const;
  return catalogue.map(({ id, title, difficulty, stats }) => ({
    id,
    title,
    tierLabel: tiers[difficulty.tier],
    cefrLabel:
      difficulty.cefrRange.from === difficulty.cefrRange.to
        ? difficulty.cefrRange.from
        : `${difficulty.cefrRange.from}–${difficulty.cefrRange.to}`,
    minutesLabel: strings.caseMinutes.replace('{minutes}', String(difficulty.estimatedMinutes)),
    summary: difficulty.summaryVi,
    recommended: difficulty.recommendedForNewPlayers,
    stats: [
      { label: strings.caseStatSuspects, value: stats.suspects },
      { label: strings.caseStatClues, value: stats.clues },
      { label: strings.caseStatContradictions, value: stats.contradictions },
      { label: strings.caseStatScenes, value: stats.scenes },
    ],
  }));
}
