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
    expect(createInitialLanguageProfile()).toMatchObject({ cefrEstimate: 'A2', vocabulary: {} });
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
