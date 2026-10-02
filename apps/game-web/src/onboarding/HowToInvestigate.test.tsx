import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { loadUiStrings } from '@lexicon/game-content';
import { HowToInvestigate } from './HowToInvestigate';
import type { InvestigationLearningProps } from '../investigation/RecordedStatements';

describe('HowToInvestigate', () => {
  const strings = loadUiStrings('vi');
  const learning: InvestigationLearningProps = {
    catalogue: [],
    strings,
    translationMode: 'Beginner',
    onEncounter: () => undefined,
    onInspect: () => undefined,
    onRevealTranslation: () => undefined,
  };
  const html = renderToString(<HowToInvestigate learning={learning} onClose={() => undefined} />);
  it('renders the how-to title and its first section', () => {
    expect(html).toContain(strings.howToTitle);
    expect(html).toContain(strings.howToControlsHeading);
  });
  it('has a close button and no case-specific text', () => {
    expect(html).toContain(strings.titleBack);
    for (const word of ['Case', 'Anna', 'Leo', 'David']) expect(html).not.toContain(word);
  });
});
