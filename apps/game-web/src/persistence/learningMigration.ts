import type { LanguageProfile, TranslationMode } from '@lexicon/shared-types';
import { createInitialLanguageProfile } from '@lexicon/learning-engine';

export type LearningRecordV1 = {
  schemaVersion: 1;
  profile: LanguageProfile;
  translationMode: TranslationMode;
  vocabularyTutorialSeen: boolean;
  updatedAt: number;
};
export const createDefaultLearningRecord = (): LearningRecordV1 => ({
  schemaVersion: 1,
  profile: createInitialLanguageProfile(),
  translationMode: 'Learning',
  vocabularyTutorialSeen: false,
  updatedAt: Date.now(),
});
const modes: readonly TranslationMode[] = ['Beginner', 'Learning', 'Immersion'];
const stages = ['seen', 'recognized', 'understood', 'used', 'mastered'] as const;
function nonnegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}
export function parseLearningRecord(
  raw: unknown,
  catalogueIds: readonly string[],
  contextIds: readonly string[],
): LearningRecordV1 {
  if (!raw || typeof raw !== 'object') throw new Error('Learning record is not an object');
  const record = raw as Record<string, unknown>;
  if (record.schemaVersion !== 1)
    throw new Error(`Unsupported learning schemaVersion: ${String(record.schemaVersion)}`);
  if (
    Object.keys(record).some(
      (key) =>
        ![
          'schemaVersion',
          'profile',
          'translationMode',
          'vocabularyTutorialSeen',
          'updatedAt',
        ].includes(key),
    )
  )
    throw new Error('Unexpected learning record fields');
  if (!modes.includes(record.translationMode as TranslationMode))
    throw new Error('Invalid translation mode');
  if (
    typeof record.vocabularyTutorialSeen !== 'boolean' ||
    typeof record.updatedAt !== 'number' ||
    !Number.isFinite(record.updatedAt)
  )
    throw new Error('Invalid learning record metadata');
  if (!record.profile || typeof record.profile !== 'object')
    throw new Error('Invalid language profile');
  const profile = record.profile as LanguageProfile;
  if (!profile.vocabulary || typeof profile.vocabulary !== 'object')
    throw new Error('Invalid vocabulary progress');
  if (!['A1', 'A2', 'B1', 'B2', 'C1'].includes(profile.cefrEstimate))
    throw new Error('Invalid CEFR estimate');
  for (const key of ['vocabulary', 'grammar', 'reading', 'listening', 'communication'] as const)
    if (!nonnegativeInteger(profile.skills?.[key]) || profile.skills[key] > 100)
      throw new Error(`Invalid ${key} skill score`);
  for (const key of ['translations', 'hints', 'transcriptOpens', 'audioReplays'] as const)
    if (!nonnegativeInteger(profile.assistance?.[key]))
      throw new Error(`Invalid ${key} assistance counter`);
  if (
    !profile.grammar ||
    typeof profile.grammar !== 'object' ||
    Object.values(profile.grammar).some((value) => !nonnegativeInteger(value))
  )
    throw new Error('Invalid grammar progress');
  for (const [id, progress] of Object.entries(profile.vocabulary)) {
    if (
      !catalogueIds.includes(id) ||
      progress.vocabularyId !== id ||
      !Array.isArray(progress.contextsSeen) ||
      !progress.contextsSeen.length ||
      !progress.contextsSeen.every((context) => contextIds.includes(context)) ||
      new Set(progress.contextsSeen).size !== progress.contextsSeen.length
    )
      throw new Error(`Invalid vocabulary context progress: ${id}`);
    if (
      !stages.includes(progress.stage as (typeof stages)[number]) ||
      !nonnegativeInteger(progress.encounterCount) ||
      progress.encounterCount !== progress.contextsSeen.length ||
      !nonnegativeInteger(progress.correctRecognitionCount) ||
      !nonnegativeInteger(progress.incorrectRecognitionCount) ||
      typeof progress.lastSeenAt !== 'string' ||
      !Number.isFinite(Date.parse(progress.lastSeenAt))
    )
      throw new Error(`Invalid vocabulary progress values: ${id}`);
    if (progress.nextReviewAt !== undefined && !Number.isFinite(Date.parse(progress.nextReviewAt)))
      throw new Error(`Invalid vocabulary review date: ${id}`);
  }
  return raw as LearningRecordV1;
}
