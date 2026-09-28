import { describe, expect, it } from 'vitest';
import { validateVocabularyReferences } from './vocabularyReferences';

const catalogue = [{ id: 'leave', lemma: 'leave', surfaceForms: ['left'] }];

describe('validateVocabularyReferences', () => {
  it('accepts a surface form annotation against the referenced entry', () => {
    expect(validateVocabularyReferences({
      source: 'cases/test', catalogue,
      evidenceContexts: [{ id: 'evidence:minutes:description', text: 'I left early.', spans: [{ start: 2, end: 6, vocabularyId: 'leave' }], vocabularyIds: ['leave'] }],
      dialogueContexts: [],
    })).toEqual([]);
  });

  it.each([
    [{ start: -1, end: 4, vocabularyId: 'leave' }, 'start'],
    [{ start: 5, end: 2, vocabularyId: 'leave' }, 'end'],
    [{ start: 0, end: 99, vocabularyId: 'leave' }, 'end'],
    [{ start: 2, end: 5, vocabularyId: 'missing' }, 'vocabularyId'],
  ])('reports field path for invalid span %o', (span, field) => {
    const issues = validateVocabularyReferences({
      source: 'cases/test', catalogue,
      evidenceContexts: [{ id: 'evidence:minutes:description', text: 'I left early.', spans: [span], vocabularyIds: ['leave'] }],
      dialogueContexts: [],
    });
    expect(issues.join('\n')).toContain(field);
  });

  it('rejects overlapping spans and a mismatch with authored surface text', () => {
    const issues = validateVocabularyReferences({
      source: 'cases/test', catalogue,
      evidenceContexts: [{ id: 'evidence:minutes:description', text: 'I left early.', spans: [
        { start: 2, end: 6, vocabularyId: 'leave' }, { start: 4, end: 8, vocabularyId: 'leave' },
      ], vocabularyIds: ['leave'] }],
      dialogueContexts: [],
    });
    expect(issues.join('\n')).toMatch(/overlap/);
  });
});
