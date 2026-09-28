import { describe, expect, it } from 'vitest';
import { vocabularyCatalogueSchema, vocabularyEntrySchema, vocabularySpanSchema } from './learning';

describe('vocabulary schemas', () => {
  it('accepts the authored entry contract', () => {
    expect(
      vocabularyEntrySchema.safeParse({
        id: 'meeting',
        lemma: 'meeting',
        partOfSpeech: 'noun',
        cefr: 'A2',
        definitionEn: 'A planned gathering.',
        translationVi: 'cuộc họp',
        examples: ['The meeting ended.'],
        tags: ['investigation'],
        surfaceForms: ['meetings'],
      }).success,
    ).toBe(true);
  });

  it('rejects a duplicate lemma or surface form within an entry', () => {
    const result = vocabularyEntrySchema.safeParse({
      id: 'leave',
      lemma: 'leave',
      partOfSpeech: 'verb',
      cefr: 'A1',
      definitionEn: 'To go away.',
      translationVi: 'rời đi',
      examples: ['I leave.'],
      tags: ['action'],
      surfaceForms: ['leave', 'leave'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects duplicate catalogue ids and lemmas', () => {
    const entry = {
      id: 'leave',
      lemma: 'leave',
      partOfSpeech: 'verb',
      cefr: 'A1',
      definitionEn: 'To go away.',
      translationVi: 'rời đi',
      examples: ['I left.'],
      tags: [],
      surfaceForms: ['left'],
    };
    expect(
      vocabularyCatalogueSchema.safeParse({ vocabulary: [entry, { ...entry, id: 'depart' }] })
        .success,
    ).toBe(false);
    expect(
      vocabularyCatalogueSchema.safeParse({
        vocabulary: [entry, { ...entry, id: 'depart', lemma: 'depart' }],
      }).success,
    ).toBe(true);
    expect(
      vocabularyCatalogueSchema.safeParse({
        vocabulary: [entry, { ...entry, id: 'depart', lemma: 'leave' }],
      }).success,
    ).toBe(false);
  });

  it('accepts only nonnegative integer UTF-16 span offsets', () => {
    expect(
      vocabularySpanSchema.safeParse({ start: 1, end: 5, vocabularyId: 'leave' }).success,
    ).toBe(true);
    expect(
      vocabularySpanSchema.safeParse({ start: 1.5, end: 5, vocabularyId: 'leave' }).success,
    ).toBe(false);
  });

  it.each([
    { start: -1, end: 3, vocabularyId: 'leave' },
    { start: 1.5, end: 3, vocabularyId: 'leave' },
  ])('rejects invalid span fields %o', (span) => {
    expect(vocabularySpanSchema.safeParse(span).success).toBe(false);
  });
});
