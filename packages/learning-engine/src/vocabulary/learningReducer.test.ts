import { describe, expect, it } from 'vitest';
import { applyLearningAction, createInitialLanguageProfile } from './learningReducer';

const catalogue = [
  {
    id: 'leave',
    lemma: 'leave',
    partOfSpeech: 'verb',
    cefr: 'A1' as const,
    definitionEn: 'go away',
    translationVi: 'rời đi',
    examples: ['I left.'],
    tags: [],
    surfaceForms: ['left'],
  },
];
const contexts = [
  { id: 'dialogue:anna:entry:text', vocabularyIds: ['leave'] },
  { id: 'evidence:minutes:description', vocabularyIds: ['leave'] },
];

describe('learning reducer', () => {
  it('starts at A2 with empty vocabulary progress', () => {
    expect(createInitialLanguageProfile()).toMatchObject({
      cefrEstimate: 'A2',
      vocabulary: {},
      listening: {
        subtitleUses: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        totalTimeToExtractFactMs: 0,
        timedFacts: 0,
      },
    });
  });

  it('records listening assistance and answer telemetry', () => {
    const initial = createInitialLanguageProfile();
    const actions = [
      { type: 'recordListeningEvent', event: 'replay' },
      { type: 'recordListeningEvent', event: 'subtitleUsed' },
      { type: 'recordListeningEvent', event: 'transcriptOpened' },
      { type: 'recordListeningEvent', event: 'hintUsed' },
      { type: 'recordListeningEvent', event: 'answerIncorrect' },
      { type: 'recordListeningEvent', event: 'answerCorrect', elapsedMs: 1250 },
    ] as const;
    const result = actions.reduce((profile, action) => {
      const next = applyLearningAction(
        profile,
        catalogue,
        contexts,
        action,
        '2026-09-29T00:00:00.000Z',
      );
      if (!next.ok) throw new Error(next.error.detail);
      return next.profile;
    }, initial);
    expect(result.assistance).toEqual({
      translations: 0,
      hints: 1,
      transcriptOpens: 1,
      audioReplays: 1,
    });
    expect(result.listening).toEqual({
      subtitleUses: 1,
      correctAnswers: 1,
      incorrectAnswers: 1,
      totalTimeToExtractFactMs: 1250,
      timedFacts: 1,
    });
  });

  it('rejects malformed listening elapsed times without changing the profile', () => {
    const profile = createInitialLanguageProfile();
    for (const elapsedMs of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
      const result = applyLearningAction(
        profile,
        catalogue,
        contexts,
        { type: 'recordListeningEvent', event: 'answerCorrect', elapsedMs },
        '2026-09-29T00:00:00.000Z',
      );
      expect(result).toMatchObject({ ok: false, profile, error: { code: 'invalidAction' } });
    }
  });

  it('counts a correct answer without timing when playback never started', () => {
    const result = applyLearningAction(
      createInitialLanguageProfile(),
      catalogue,
      contexts,
      { type: 'recordListeningEvent', event: 'answerCorrect' },
      '2026-09-29T00:00:00.000Z',
    );
    expect(result.ok && result.profile.listening).toEqual({
      subtitleUses: 0,
      correctAnswers: 1,
      incorrectAnswers: 0,
      totalTimeToExtractFactMs: 0,
      timedFacts: 0,
    });
  });

  it('records one seen context and deduplicates retry', () => {
    const initial = createInitialLanguageProfile();
    const first = applyLearningAction(
      initial,
      catalogue,
      contexts,
      { type: 'encounterContext', vocabularyId: 'leave', contextId: contexts[0]!.id },
      '2026-09-28T00:00:00.000Z',
    );
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.profile.vocabulary.leave).toMatchObject({
      stage: 'seen',
      encounterCount: 1,
      contextsSeen: [contexts[0]!.id],
    });
    const retry = applyLearningAction(
      first.profile,
      catalogue,
      contexts,
      { type: 'encounterContext', vocabularyId: 'leave', contextId: contexts[0]!.id },
      '2026-09-29T00:00:00.000Z',
    );
    expect(retry.ok && retry.profile).toEqual(first.profile);
    expect(retry.ok && retry.events).toEqual([]);
  });

  it('rejects unknown references without replacing the input profile', () => {
    const initial = createInitialLanguageProfile();
    const result = applyLearningAction(
      initial,
      catalogue,
      contexts,
      { type: 'encounterContext', vocabularyId: 'missing', contextId: contexts[0]!.id },
      '2026-09-28T00:00:00.000Z',
    );
    expect(result).toMatchObject({
      ok: false,
      profile: initial,
      error: { code: 'unknownVocabulary' },
    });
  });

  it('counts a genuinely new context once without promoting the stage', () => {
    const first = applyLearningAction(
      createInitialLanguageProfile(),
      catalogue,
      contexts,
      { type: 'encounterContext', vocabularyId: 'leave', contextId: contexts[0]!.id },
      '2026-09-28T00:00:00.000Z',
    );
    if (!first.ok) throw new Error('expected first encounter to succeed');
    const second = applyLearningAction(
      first.profile,
      catalogue,
      contexts,
      { type: 'encounterContext', vocabularyId: 'leave', contextId: contexts[1]!.id },
      '2026-09-29T00:00:00.000Z',
    );
    expect(second.ok && second.profile.vocabulary.leave).toMatchObject({
      stage: 'seen',
      encounterCount: 2,
      contextsSeen: contexts.map((context) => context.id),
    });
  });

  it('preserves an already achieved stage when recording another context', () => {
    const profile = createInitialLanguageProfile();
    profile.vocabulary.leave = {
      vocabularyId: 'leave',
      stage: 'understood',
      encounterCount: 1,
      correctRecognitionCount: 0,
      incorrectRecognitionCount: 0,
      lastSeenAt: '2026-09-28T00:00:00.000Z',
      contextsSeen: [contexts[0]!.id],
    };
    const result = applyLearningAction(
      profile,
      catalogue,
      contexts,
      { type: 'encounterContext', vocabularyId: 'leave', contextId: contexts[1]!.id },
      '2026-09-29T00:00:00.000Z',
    );
    expect(result.ok && result.profile.vocabulary.leave).toMatchObject({
      stage: 'understood',
      encounterCount: 2,
    });
  });

  it('requires seen context for inspection and counts explicit translation only', () => {
    const profile = createInitialLanguageProfile();
    const earlyInspect = applyLearningAction(
      profile,
      catalogue,
      contexts,
      { type: 'inspectVocabulary', vocabularyId: 'leave', contextId: contexts[0]!.id },
      '2026-09-28T00:00:00.000Z',
    );
    expect(earlyInspect).toMatchObject({ ok: false, profile, error: { code: 'contextNotSeen' } });
    const seen = applyLearningAction(
      profile,
      catalogue,
      contexts,
      { type: 'encounterContext', vocabularyId: 'leave', contextId: contexts[0]!.id },
      '2026-09-28T00:00:00.000Z',
    );
    if (!seen.ok) throw new Error('expected encounter to succeed');
    const inspected = applyLearningAction(
      seen.profile,
      catalogue,
      contexts,
      { type: 'inspectVocabulary', vocabularyId: 'leave', contextId: contexts[0]!.id },
      '2026-09-28T00:00:00.000Z',
    );
    expect(inspected.ok && inspected.profile).toBe(seen.profile);
    const revealed = applyLearningAction(
      seen.profile,
      catalogue,
      contexts,
      { type: 'revealTranslation', vocabularyId: 'leave', contextId: contexts[0]!.id },
      '2026-09-28T00:00:00.000Z',
    );
    expect(revealed.ok && revealed.profile.assistance.translations).toBe(1);
  });

  it('rejects mismatched context and malformed timestamps without mutation', () => {
    const profile = createInitialLanguageProfile();
    const mismatch = applyLearningAction(
      profile,
      catalogue,
      [{ id: contexts[0]!.id, vocabularyIds: [] }],
      { type: 'encounterContext', vocabularyId: 'leave', contextId: contexts[0]!.id },
      '2026-09-28T00:00:00.000Z',
    );
    expect(mismatch).toMatchObject({
      ok: false,
      profile,
      error: { code: 'contextVocabularyMismatch' },
    });
    const invalidTime = applyLearningAction(
      profile,
      catalogue,
      contexts,
      { type: 'encounterContext', vocabularyId: 'leave', contextId: contexts[0]!.id },
      'not-a-date',
    );
    expect(invalidTime).toMatchObject({ ok: false, profile, error: { code: 'invalidTimestamp' } });
  });
});

describe('learning reducer edge cases', () => {
  const nowIso = '2026-09-29T00:00:00.000Z';
  const seen = (profile = createInitialLanguageProfile(), contextId = contexts[0]!.id) => {
    const result = applyLearningAction(
      profile,
      catalogue,
      contexts,
      { type: 'encounterContext', vocabularyId: 'leave', contextId },
      nowIso,
    );
    if (!result.ok) throw new Error(result.error.detail);
    return result.profile;
  };

  it('rejects a negative or non-finite elapsed time on a correct answer', () => {
    for (const elapsedMs of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
      const result = applyLearningAction(
        createInitialLanguageProfile(),
        catalogue,
        contexts,
        { type: 'recordListeningEvent', event: 'answerCorrect', elapsedMs },
        nowIso,
      );
      expect(result).toMatchObject({ ok: false, error: { code: 'invalidAction' } });
    }
  });

  it('keeps a higher stage when the word is met in a second context', () => {
    const profile = seen();
    const advanced = {
      ...profile,
      vocabulary: { leave: { ...profile.vocabulary.leave!, stage: 'understood' as const } },
    };
    const next = seen(advanced, contexts[1]!.id);
    expect(next.vocabulary.leave).toMatchObject({ stage: 'understood', encounterCount: 2 });
  });

  it('does not count the same context twice', () => {
    const once = seen();
    const again = applyLearningAction(
      once,
      catalogue,
      contexts,
      { type: 'encounterContext', vocabularyId: 'leave', contextId: contexts[0]!.id },
      nowIso,
    );
    expect(again).toEqual({ ok: true, profile: once, events: [] });
  });

  it('refuses to reveal a translation the content does not author', () => {
    const noTranslation = [{ ...catalogue[0]!, translationVi: undefined }];
    const profile = seen();
    const result = applyLearningAction(
      profile,
      noTranslation,
      contexts,
      { type: 'revealTranslation', vocabularyId: 'leave', contextId: contexts[0]!.id },
      nowIso,
    );
    expect(result).toMatchObject({ ok: false, error: { code: 'translationUnavailable' } });
    expect(result.profile).toBe(profile);
  });

  it('reports an unsupported action instead of throwing', () => {
    const profile = seen();
    const result = applyLearningAction(
      profile,
      catalogue,
      contexts,
      { type: 'bogus', vocabularyId: 'leave', contextId: contexts[0]!.id } as never,
      nowIso,
    );
    expect(result).toMatchObject({ ok: false, error: { code: 'invalidAction' } });
  });
});
