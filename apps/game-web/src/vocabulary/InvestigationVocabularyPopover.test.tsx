import { createRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { loadCaseDefinition, loadUiStrings } from '@lexicon/game-content';
import type { VocabularyEntry } from '@lexicon/shared-types';
import {
  InvestigationVocabularyPopover,
  buildPopoverBlocks,
} from './InvestigationVocabularyPopover';

const definition = loadCaseDefinition('case-001');
const strings = loadUiStrings('vi');
const entry: VocabularyEntry = {
  ...definition.vocabulary.find((word) => word.lemma === 'leave')!,
  synonyms: ['depart', 'exit'],
  examples: Array.from({ length: 6 }, (_, i) => `Long example sentence number ${i + 1}.`),
};
const ids = (blocks: ReturnType<typeof buildPopoverBlocks>) => blocks.map((b) => b.id);
const textOf = (blocks: ReturnType<typeof buildPopoverBlocks>) =>
  blocks.map((b) => (b.kind === 'text' ? b.text : '')).join('\n');

describe('buildPopoverBlocks', () => {
  it('keeps the full definition card as ordered blocks, so long entries page instead of clipping', () => {
    const blocks = buildPopoverBlocks(entry, 'Immersion', strings, false, false);
    expect(ids(blocks)).toEqual([
      `${entry.id}:title`,
      `${entry.id}:part`,
      `${entry.id}:definition`,
      `${entry.id}:synonyms`,
      ...entry.examples.map((_, i) => `${entry.id}:example:${i}`),
    ]);
    for (const example of entry.examples) expect(textOf(blocks)).toContain(example);
  });

  it('Learning shows a reveal action until the translation is asked for, then the text once', () => {
    const hidden = buildPopoverBlocks(entry, 'Learning', strings, false, false);
    expect(hidden.find((b) => b.id === `${entry.id}:reveal`)?.kind).toBe('fixed');
    expect(textOf(hidden)).not.toContain(entry.translationVi);
    const shown = buildPopoverBlocks(entry, 'Learning', strings, true, false);
    expect(shown.some((b) => b.id === `${entry.id}:reveal`)).toBe(false);
    expect(shown.filter((b) => b.id === `${entry.id}:translation`)).toHaveLength(1);
    expect(textOf(shown)).toContain(entry.translationVi);
  });

  it('Beginner always shows the translation and Immersion never does', () => {
    expect(textOf(buildPopoverBlocks(entry, 'Beginner', strings, false, false))).toContain(
      entry.translationVi,
    );
    const immersion = buildPopoverBlocks(entry, 'Immersion', strings, true, false);
    expect(textOf(immersion)).not.toContain(entry.translationVi);
    expect(immersion.some((b) => b.id === `${entry.id}:reveal`)).toBe(false);
  });

  it('puts the one-time tutorial line first', () => {
    const blocks = buildPopoverBlocks(entry, 'Learning', strings, false, true);
    expect(blocks[0]).toMatchObject({
      id: `${entry.id}:tutorial`,
      text: strings.vocabularyTutorial,
    });
  });
});

describe('InvestigationVocabularyPopover', () => {
  it('renders a labelled dialog with a 44px-class close action outside the paged text', () => {
    const html = renderToStaticMarkup(
      <InvestigationVocabularyPopover
        entry={entry}
        mode="Learning"
        strings={strings}
        popupId="popup-1"
        popupRef={createRef<HTMLDivElement>()}
        host={null}
        revealed={false}
        showTutorial={false}
        onReveal={() => undefined}
        onClose={() => undefined}
      />,
    );
    expect(html).toContain('role="dialog"');
    expect(html).toContain(`aria-label="${entry.lemma}"`);
    expect(html).toContain('investigation-vocabulary-popover');
    expect(html).toContain('investigation-vocabulary-close');
    expect(html).toContain(strings.close);
  });
});
