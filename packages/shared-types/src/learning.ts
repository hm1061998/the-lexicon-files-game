export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
export type TranslationMode = 'Beginner' | 'Learning' | 'Immersion';
export type VocabularyStage =
  'unknown' | 'seen' | 'recognized' | 'understood' | 'used' | 'mastered';
export interface VocabularyEntry {
  readonly id: string;
  readonly lemma: string;
  readonly partOfSpeech: string;
  readonly cefr: CEFRLevel;
  readonly definitionEn: string;
  readonly translationVi: string;
  readonly examples: readonly string[];
  readonly synonyms?: readonly string[] | undefined;
  readonly tags: readonly string[];
  readonly surfaceForms: readonly string[];
}
export interface VocabularySpan {
  readonly start: number;
  readonly end: number;
  readonly vocabularyId: string;
}
export interface VocabularyContextDefinition {
  readonly id: string;
  readonly vocabularyIds: readonly string[];
}
export interface VocabularyProgress {
  readonly vocabularyId: string;
  readonly stage: VocabularyStage;
  readonly encounterCount: number;
  readonly correctRecognitionCount: number;
  readonly incorrectRecognitionCount: number;
  readonly lastSeenAt: string;
  readonly nextReviewAt?: string;
  readonly contextsSeen: readonly string[];
}
export interface LanguageProfile {
  readonly cefrEstimate: CEFRLevel;
  readonly skills: Readonly<
    Record<'vocabulary' | 'grammar' | 'reading' | 'listening' | 'communication', number>
  >;
  readonly vocabulary: Readonly<Record<string, VocabularyProgress>>;
  readonly grammar: Readonly<Record<string, number>>;
  readonly assistance: Readonly<
    Record<'translations' | 'hints' | 'transcriptOpens' | 'audioReplays', number>
  >;
}
export type LearningAction =
  | { readonly type: 'encounterContext'; readonly vocabularyId: string; readonly contextId: string }
  | {
      readonly type: 'inspectVocabulary';
      readonly vocabularyId: string;
      readonly contextId: string;
    }
  | {
      readonly type: 'revealTranslation';
      readonly vocabularyId: string;
      readonly contextId: string;
    };
export type LearningDomainEvent =
  | { readonly type: 'vocabularySeen'; readonly vocabularyId: string; readonly contextId: string }
  | {
      readonly type: 'vocabularyInspected';
      readonly vocabularyId: string;
      readonly contextId: string;
    }
  | {
      readonly type: 'translationRevealed';
      readonly vocabularyId: string;
      readonly contextId: string;
    };
export type LearningError = {
  readonly code:
    | 'unknownVocabulary'
    | 'unknownContext'
    | 'contextVocabularyMismatch'
    | 'contextNotSeen'
    | 'translationUnavailable'
    | 'invalidTimestamp'
    | 'invalidAction';
  readonly detail: string;
};
