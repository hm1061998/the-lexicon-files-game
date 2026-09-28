import type {
  LanguageProfile,
  LearningAction,
  LearningDomainEvent,
  LearningError,
  VocabularyContextDefinition,
  VocabularyEntry,
  VocabularyProgress,
} from '@lexicon/shared-types';

export function createInitialLanguageProfile(): LanguageProfile {
  return {
    cefrEstimate: 'A2',
    skills: { vocabulary: 0, grammar: 0, reading: 0, listening: 0, communication: 0 },
    vocabulary: {},
    grammar: {},
    assistance: { translations: 0, hints: 0, transcriptOpens: 0, audioReplays: 0 },
  };
}

type Result =
  | { ok: true; profile: LanguageProfile; events: readonly LearningDomainEvent[] }
  | { ok: false; profile: LanguageProfile; error: LearningError };

export function applyLearningAction(
  profile: LanguageProfile,
  catalogue: readonly VocabularyEntry[],
  contexts: readonly VocabularyContextDefinition[],
  action: LearningAction,
  nowIso: string,
): Result {
  const fail = (code: LearningError['code'], detail: string): Result => ({
    ok: false,
    profile,
    error: { code, detail },
  });
  if (!Number.isFinite(Date.parse(nowIso)) || !nowIso.includes('T'))
    return fail('invalidTimestamp', 'Timestamp must be a valid ISO date-time.');
  const entry = catalogue.find((item) => item.id === action.vocabularyId);
  if (!entry) return fail('unknownVocabulary', `Unknown vocabulary id: ${action.vocabularyId}`);
  const context = contexts.find((item) => item.id === action.contextId);
  if (!context) return fail('unknownContext', `Unknown vocabulary context: ${action.contextId}`);
  if (!context.vocabularyIds.includes(action.vocabularyId))
    return fail('contextVocabularyMismatch', 'Vocabulary is not annotated in this context.');
  const current = profile.vocabulary[action.vocabularyId];
  if (action.type === 'encounterContext') {
    if (current?.contextsSeen.includes(action.contextId)) return { ok: true, profile, events: [] };
    const progress: VocabularyProgress = {
      vocabularyId: action.vocabularyId,
      stage: 'seen',
      encounterCount: (current?.encounterCount ?? 0) + 1,
      correctRecognitionCount: current?.correctRecognitionCount ?? 0,
      incorrectRecognitionCount: current?.incorrectRecognitionCount ?? 0,
      lastSeenAt: nowIso,
      contextsSeen: [...(current?.contextsSeen ?? []), action.contextId],
    };
    return {
      ok: true,
      profile: { ...profile, vocabulary: { ...profile.vocabulary, [entry.id]: progress } },
      events: [{ type: 'vocabularySeen', vocabularyId: entry.id, contextId: context.id }],
    };
  }
  if (!current?.contextsSeen.includes(action.contextId))
    return fail('contextNotSeen', 'Encounter the vocabulary context before inspecting it.');
  if (action.type === 'inspectVocabulary')
    return {
      ok: true,
      profile,
      events: [{ type: 'vocabularyInspected', vocabularyId: entry.id, contextId: context.id }],
    };
  if (action.type === 'revealTranslation') {
    if (!entry.translationVi)
      return fail('translationUnavailable', 'No authored translation is available.');
    return {
      ok: true,
      profile: {
        ...profile,
        assistance: { ...profile.assistance, translations: profile.assistance.translations + 1 },
      },
      events: [{ type: 'translationRevealed', vocabularyId: entry.id, contextId: context.id }],
    };
  }
  return fail('invalidAction', 'Unsupported learning action.');
}
