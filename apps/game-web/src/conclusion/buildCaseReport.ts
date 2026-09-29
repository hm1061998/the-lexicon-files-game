import type { CaseDefinition, GameState, LanguageProfile } from '@lexicon/shared-types';

export type CaseReport = {
  readonly evidenceFound: number;
  readonly evidenceTotal: number;
  readonly keyContradictionFound: boolean;
  readonly peopleInterviewed: number;
  readonly peopleTotal: number;
  readonly listeningTaskCompleted: boolean;
  /** Learning metrics below are profile-wide, not specific to this case. */
  readonly vocabularyEncountered: number;
  readonly vocabularyMastered: number;
  readonly listeningAccuracyPercent: number | null;
  readonly hintsUsed: number;
};

/** Pure projection: never writes to the case save or the language profile. */
export function buildCaseReport(
  definition: CaseDefinition,
  state: GameState,
  profile: LanguageProfile,
): CaseReport {
  const flagSet = (key: string) => state.flags[key] === true;
  const interviewTrees = definition.dialogues.filter((tree) =>
    definition.npcs.some((npc) => npc.dialogueTreeId === tree.id),
  );
  const vocabulary = Object.values(profile.vocabulary);
  const { correctAnswers, incorrectAnswers } = profile.listening;
  const answered = correctAnswers + incorrectAnswers;

  return {
    evidenceFound: state.evidenceIds.length,
    evidenceTotal: definition.evidenceTotal,
    keyContradictionFound:
      definition.contradictions.length > 0 &&
      definition.contradictions.every(({ id }) => state.contradictionIds.includes(id)),
    peopleInterviewed: interviewTrees.filter((tree) => flagSet(tree.completionFlag)).length,
    peopleTotal: interviewTrees.length,
    listeningTaskCompleted:
      definition.listeningTasks.length > 0 &&
      definition.listeningTasks.every((task) => flagSet(task.completionFlag)),
    vocabularyEncountered: vocabulary.filter((entry) => entry.encounterCount > 0).length,
    vocabularyMastered: vocabulary.filter((entry) => entry.stage === 'mastered').length,
    listeningAccuracyPercent: answered === 0 ? null : Math.round((correctAnswers / answered) * 100),
    hintsUsed: profile.assistance.hints,
  };
}
