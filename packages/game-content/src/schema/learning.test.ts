import { describe, expect, it } from 'vitest';
import { vocabularyEntrySchema, vocabularySpanSchema } from './learning';

describe('vocabulary schemas', () => {
  it('accepts the authored entry contract', () => {
    expect(
      vocabularyEntrySchema.safeParse({
        id: 'meeting', lemma: 'meeting', partOfSpeech: 'noun', cefr: 'A2',
        definitionEn: 'A planned gathering.', translationVi: 'cuộc họp',
        examples: ['The meeting ended.'], tags: ['investigation'], surfaceForms: ['meetings'],
      }).success,
    ).toBe(true);
  });

  it('rejects a duplicate lemma or surface form within an entry', () => {
    const result = vocabularyEntrySchema.safeParse({
      id: 'leave', lemma: 'leave', partOfSpeech: 'verb', cefr: 'A1',
      definitionEn: 'To go away.', translationVi: 'rời đi', examples: ['I leave.'],
      tags: ['action'], surfaceForms: ['leave', 'leave'],
    });
    expect(result.success).toBe(false);
  });

  it('accepts only nonnegative integer UTF-16 span offsets', () => {
    expect(vocabularySpanSchema.safeParse({ start: 1, end: 5, vocabularyId: 'leave' }).success).toBe(true);
    expect(vocabularySpanSchema.safeParse({ start: 1.5, end: 5, vocabularyId: 'leave' }).success).toBe(false);
  });
});
