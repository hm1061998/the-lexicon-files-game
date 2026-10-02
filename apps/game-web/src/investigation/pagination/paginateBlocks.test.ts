import { expect, it } from 'vitest';
import { paginateBlocks, pageForAnchor } from './paginateBlocks';
import type { ReaderBlock } from './pageTypes';
const block: ReaderBlock = {
  kind: 'text',
  id: 'a',
  text: 'A confidential document follows. Another very long statement.',
  contextId: 'original',
  spans: [{ start: 2, end: 14, vocabularyId: 'word' }],
};
it('packs measured fragments without losing text, spans, or order', () => {
  const layout = paginateBlocks([block, { kind: 'fixed', id: 'image' }], 20, (f) =>
    f.blockId === 'image' ? 15 : Math.ceil((f.end - f.start) / 15) * 10,
  );
  expect(layout.pages.length).toBeGreaterThan(1);
  expect(
    layout.pages
      .flat()
      .filter((f) => f.blockId === 'a')
      .map((f) => block.text.slice(f.start, f.end))
      .join(''),
  ).toBe(block.text);
  expect(layout.pages.flat().filter((f) => f.blockId === 'image')).toHaveLength(1);
  expect(layout.pages.flat().some((f) => f.start > 2 && f.start < 14)).toBe(false);
  const anchor = { blockId: 'a', offset: 35 };
  const i = pageForAnchor(layout, anchor);
  expect(layout.pages[i]?.some((f) => f.start <= 35 && f.end > 35)).toBe(true);
});
it('provides an empty page and refuses impossible oversized fixed content', () => {
  expect(paginateBlocks([], 50, () => 10).pages).toEqual([[]]);
  expect(() => paginateBlocks([{ kind: 'fixed', id: 'huge' }], 5, () => 10)).toThrow('huge');
});
