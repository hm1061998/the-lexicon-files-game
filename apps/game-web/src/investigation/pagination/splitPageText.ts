import type { VocabularySpan } from '@lexicon/shared-types';
import type { ReaderBlock } from './pageTypes';
export function legalTextBreaks(text: string, spans: readonly VocabularySpan[]): readonly number[] {
  const points = [0];
  for (let i = 0; i < text.length;) {
    i += (text.codePointAt(i) ?? 0) > 0xffff ? 2 : 1;
    if (!spans.some((s) => s.start < i && i < s.end)) points.push(i);
  }
  return points;
}
export function slicePageText(
  block: Extract<ReaderBlock, { kind: 'text' }>,
  start: number,
  end: number,
) {
  return {
    text: block.text.slice(start, end),
    contextId: block.contextId,
    spans: block.spans
      .filter((s) => s.start >= start && s.end <= end)
      .map((s) => ({ ...s, start: s.start - start, end: s.end - start })),
  };
}
