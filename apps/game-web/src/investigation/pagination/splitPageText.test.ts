import { expect, it } from 'vitest';
import { legalTextBreaks, slicePageText } from './splitPageText';
it('preserves text context and whole vocabulary spans including unicode', () => {
  const block = {
    kind: 'text' as const,
    id: 'statement',
    text: 'A confidential file 😀 follows.',
    contextId: 'dialogue:original',
    spans: [{ start: 2, end: 14, vocabularyId: 'confidential' }],
  };
  const breaks = legalTextBreaks(block.text, block.spans);
  expect(breaks.some((n) => n > 2 && n < 14)).toBe(false);
  expect(breaks).not.toContain(21);
  const fragments = [slicePageText(block, 0, 2), slicePageText(block, 2, block.text.length)];
  expect(fragments.map((f) => f.text).join('')).toBe(block.text);
  expect(fragments[1]?.spans[0]).toEqual({ start: 0, end: 12, vocabularyId: 'confidential' });
  expect(fragments.every((f) => f.contextId === block.contextId)).toBe(true);
});
it('has usable breaks for long text without spaces and newlines', () => {
  expect(legalTextBreaks('abcdef', [])).toEqual([0, 1, 2, 3, 4, 5, 6]);
  expect(legalTextBreaks('a\nb', [])).toContain(2);
});
