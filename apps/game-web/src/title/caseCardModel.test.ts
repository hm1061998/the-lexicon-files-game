import { describe, expect, it } from 'vitest';
import { listCaseCatalogue, loadUiStrings } from '@lexicon/game-content';
import { selectCaseCards } from './caseCardModel';

const strings = loadUiStrings('vi');
const catalogue = listCaseCatalogue();

describe('selectCaseCards', () => {
  it('builds one card per catalogue entry in order', () => {
    const cards = selectCaseCards(catalogue, strings);
    expect(cards.map(({ id }) => id)).toEqual(catalogue.map(({ id }) => id));
    expect(cards.map(({ title }) => title)).toEqual(catalogue.map(({ title }) => title));
  });

  it('formats tier, CEFR range and minutes from the strings', () => {
    const [easy, medium] = selectCaseCards(catalogue, strings);
    expect(easy!.tierLabel).toBe(strings.caseTierEasy);
    expect(medium!.tierLabel).toBe(strings.caseTierMedium);
    expect(easy!.cefrLabel).toBe('A2–B1');
    expect(easy!.minutesLabel).toBe(
      strings.caseMinutes.replace('{minutes}', String(catalogue[0]!.difficulty.estimatedMinutes)),
    );
    expect(easy!.summary).toBe(catalogue[0]!.difficulty.summaryVi);
  });

  it('marks only the recommended case', () => {
    const cards = selectCaseCards(catalogue, strings);
    expect(cards.filter(({ recommended }) => recommended).map(({ id }) => id)).toEqual([
      'case-001',
    ]);
  });

  it('lists suspects, clues, contradictions and scenes as computed stats', () => {
    const [first, second] = selectCaseCards(catalogue, strings);
    expect(first!.stats).toEqual([
      { label: strings.caseStatSuspects, value: 3 },
      { label: strings.caseStatClues, value: 5 },
      { label: strings.caseStatContradictions, value: 1 },
      { label: strings.caseStatScenes, value: 2 },
    ]);
    expect(second!.stats.map(({ value }) => value)).toEqual([3, 6, 2, 3]);
  });

  it('shows a single CEFR level when the range is one level', () => {
    const entry = {
      ...catalogue[0]!,
      difficulty: { ...catalogue[0]!.difficulty, cefrRange: { from: 'B1', to: 'B1' } as const },
    };
    expect(selectCaseCards([entry], strings)[0]!.cefrLabel).toBe('B1');
  });
});
