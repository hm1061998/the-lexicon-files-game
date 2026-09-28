import { describe, expect, it } from 'vitest';
import { applyLearningAction, createInitialLanguageProfile } from './learningReducer';

const catalogue = [{ id: 'leave', lemma: 'leave', partOfSpeech: 'verb', cefr: 'A1' as const, definitionEn: 'go away', translationVi: 'rời đi', examples: ['I left.'], tags: [], surfaceForms: ['left'] }];
const contexts = [{ id: 'dialogue:anna:entry:text', vocabularyIds: ['leave'] }];

describe('learning reducer', () => {
  it('starts at A2 with empty vocabulary progress', () => {
    expect(createInitialLanguageProfile()).toMatchObject({ cefrEstimate: 'A2', vocabulary: {} });
  });

  it('records one seen context and deduplicates retry', () => {
    const initial = createInitialLanguageProfile();
    const first = applyLearningAction(initial, catalogue, contexts, { type: 'encounterContext', vocabularyId: 'leave', contextId: contexts[0]!.id }, '2026-09-28T00:00:00.000Z');
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.profile.vocabulary.leave).toMatchObject({ stage: 'seen', encounterCount: 1, contextsSeen: [contexts[0]!.id] });
    const retry = applyLearningAction(first.profile, catalogue, contexts, { type: 'encounterContext', vocabularyId: 'leave', contextId: contexts[0]!.id }, '2026-09-29T00:00:00.000Z');
    expect(retry.ok && retry.profile).toEqual(first.profile);
    expect(retry.ok && retry.events).toEqual([]);
  });

  it('rejects unknown references without replacing the input profile', () => {
    const initial = createInitialLanguageProfile();
    const result = applyLearningAction(initial, catalogue, contexts, { type: 'encounterContext', vocabularyId: 'missing', contextId: contexts[0]!.id }, '2026-09-28T00:00:00.000Z');
    expect(result).toMatchObject({ ok: false, profile: initial, error: { code: 'unknownVocabulary' } });
  });
});
