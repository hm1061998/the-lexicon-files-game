import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { listCaseCatalogue, loadUiStrings } from '@lexicon/game-content';
import { CasePicker } from './CasePicker';
import { selectCaseCards } from './caseCardModel';

const strings = loadUiStrings('vi');
const cards = selectCaseCards(listCaseCatalogue(), strings);
const html = renderToString(
  <CasePicker strings={strings} cards={cards} onSelect={() => undefined} />,
);

describe('CasePicker', () => {
  it('renders each case as a button named by its title', () => {
    const buttons = [...html.matchAll(/<button[^>]*>(.*?)<\/button>/gs)].map((m) => m[1]!);
    expect(buttons).toHaveLength(cards.length);
    cards.forEach((card, index) => expect(buttons[index]).toContain(card.title));
  });

  it('flags the recommended case once', () => {
    expect(html.split(strings.caseRecommended)).toHaveLength(2);
  });

  it('shows the heading, tier, level, minutes and every stat label', () => {
    expect(html).toContain(strings.titleChooseCase);
    for (const card of cards) {
      for (const text of [card.tierLabel, card.cefrLabel, card.minutesLabel, card.summary])
        expect(html).toContain(text);
      for (const { label } of card.stats) expect(html).toContain(label);
    }
  });

  it('has no score, rank or countdown wording', () => {
    expect(html).not.toMatch(/điểm số|xếp hạng|đếm ngược|score|rank|timer/i);
  });
});
