import type { LanguageProfile, TranslationMode } from '@lexicon/shared-types';
import { createInitialLanguageProfile } from '@lexicon/learning-engine';
import {
  COACH_NOTE_IDS,
  allOnboardingSeen,
  type OnboardingSeen,
} from '../onboarding/onboardingTypes';

export type LearningRecordV3 = {
  schemaVersion: 3;
  profile: LanguageProfile;
  vocabularyTutorialSeen: boolean;
  onboardingSeen: OnboardingSeen;
  updatedAt: number;
};
export type ParsedLearningRecord = {
  record: LearningRecordV3;
  legacyTranslationMode: TranslationMode | null;
  migrated: boolean;
};
export const createDefaultLearningRecord = (): LearningRecordV3 => ({
  schemaVersion: 3,
  profile: createInitialLanguageProfile(),
  vocabularyTutorialSeen: false,
  onboardingSeen: allOnboardingSeen(false),
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
): ParsedLearningRecord {
  if (!raw || typeof raw !== 'object') throw new Error('Learning record is not an object');
  const record = raw as Record<string, unknown>;
  const version = record.schemaVersion;
  if (version !== 1 && version !== 2 && version !== 3)
    throw new Error(`Unsupported learning schemaVersion: ${String(record.schemaVersion)}`);
  if (
    Object.keys(record).some(
      (key) =>
        ![
          'schemaVersion',
          'profile',
          ...(version === 1 ? ['translationMode'] : []),
          ...(version === 3 ? ['onboardingSeen'] : []),
          'vocabularyTutorialSeen',
          'updatedAt',
        ].includes(key),
    )
  )
    throw new Error('Unexpected learning record fields');
  if (version === 1 && !modes.includes(record.translationMode as TranslationMode))
    throw new Error('Invalid translation mode');
  if (
    typeof record.vocabularyTutorialSeen !== 'boolean' ||
    typeof record.updatedAt !== 'number' ||
    !Number.isFinite(record.updatedAt)
  )
    throw new Error('Invalid learning record metadata');
  if (version === 3) {
    const seen = record.onboardingSeen as Record<string, unknown> | null | undefined;
    if (
      !seen ||
      typeof seen !== 'object' ||
      Object.keys(seen).length !== COACH_NOTE_IDS.length ||
      !COACH_NOTE_IDS.every((id) => typeof seen[id] === 'boolean')
    )
      throw new Error('Invalid onboarding flags');
  }
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
  const listening = profile.listening ?? {
    subtitleUses: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    totalTimeToExtractFactMs: 0,
    timedFacts: 0,
  };
  for (const key of ['subtitleUses', 'correctAnswers', 'incorrectAnswers', 'timedFacts'] as const)
    if (!nonnegativeInteger(listening[key])) throw new Error(`Invalid ${key} listening counter`);
  if (
    typeof listening.totalTimeToExtractFactMs !== 'number' ||
    !Number.isFinite(listening.totalTimeToExtractFactMs) ||
    listening.totalTimeToExtractFactMs < 0
  )
    throw new Error('Invalid totalTimeToExtractFactMs listening counter');
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
  // Players who predate the hints have already learned the basics: show them nothing.
  const experienced =
    record.vocabularyTutorialSeen === true || Object.keys(profile.vocabulary).length > 0;
  return {
    record: {
      schemaVersion: 3,
      profile: { ...profile, listening },
      vocabularyTutorialSeen: record.vocabularyTutorialSeen,
      onboardingSeen:
        version === 3 ? (record.onboardingSeen as OnboardingSeen) : allOnboardingSeen(experienced),
      updatedAt: record.updatedAt,
    },
    legacyTranslationMode: version === 1 ? (record.translationMode as TranslationMode) : null,
    migrated: version !== 3,
  };
}
