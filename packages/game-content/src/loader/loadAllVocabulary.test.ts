import { describe, expect, it } from 'vitest';
import type { CaseDefinition } from '@lexicon/shared-types';
import { ContentValidationError } from './ContentValidationError';
import { loadAllVocabulary } from './loadAllVocabulary';
import { loadCaseDefinition, REGISTERED_CASE_IDS } from './loadCaseDefinition';

type Entry = CaseDefinition['vocabulary'][number];
const word = (id: string, definitionEn = `meaning of ${id}`): Entry => ({
  id,
  lemma: id,
  partOfSpeech: 'noun',
  cefr: 'A2',
  definitionEn,
  examples: [`A ${id}.`],
  tags: [],
});
const fake = (
  vocabulary: Entry[],
  vocabularyContexts: CaseDefinition['vocabularyContexts'],
): CaseDefinition => ({ vocabulary, vocabularyContexts }) as unknown as CaseDefinition;

describe('loadAllVocabulary', () => {
  it('merges identical words shared by two cases once', () => {
    const { catalogue } = loadAllVocabulary();
    for (const id of ['client', 'early']) {
      expect(catalogue.filter((entry) => entry.id === id)).toHaveLength(1);
    }
  });

  it('includes words of every registered case', () => {
    const { catalogue, contexts } = loadAllVocabulary();
    const ids = new Set(catalogue.map((entry) => entry.id));
    const contextIds = new Set(contexts.map((context) => context.id));
    for (const caseId of REGISTERED_CASE_IDS) {
      const definition = loadCaseDefinition(caseId);
      for (const entry of definition.vocabulary) expect(ids.has(entry.id), entry.id).toBe(true);
      for (const context of definition.vocabularyContexts)
        expect(contextIds.has(context.id), context.id).toBe(true);
    }
  });

  it('throws when two cases define the same word differently', () => {
    const cases = [fake([word('door', 'a')], []), fake([word('door', 'b')], [])];
    expect(() => loadAllVocabulary(['a', 'b'], (id) => cases[id === 'a' ? 0 : 1]!)).toThrow(
      ContentValidationError,
    );
  });

  it('throws when a context id repeats across cases', () => {
    const context = { id: 'dialogue:t:n:text', vocabularyIds: ['door'] };
    const cases = [fake([word('door')], [context]), fake([word('door')], [context])];
    expect(() => loadAllVocabulary(['a', 'b'], (id) => cases[id === 'a' ? 0 : 1]!)).toThrow(
      /context id "dialogue:t:n:text"/,
    );
  });
});
