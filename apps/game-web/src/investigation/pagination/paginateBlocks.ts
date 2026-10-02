import type { PageAnchor, PageFragment, PageLayout, ReaderBlock } from './pageTypes';
import { legalTextBreaks, slicePageText } from './splitPageText';
export function paginateBlocks(
  blocks: readonly ReaderBlock[],
  pageHeight: number,
  measure: (fragment: PageFragment) => number,
): PageLayout {
  const pages: PageFragment[][] = [[]];
  let used = 0;
  const next = () => {
    if (pages[pages.length - 1]!.length) pages.push([]);
    used = 0;
  };
  for (const b of blocks) {
    if (b.kind === 'fixed') {
      const f = { blockId: b.id, start: 0, end: 0, spans: [] };
      const h = measure(f);
      if (h > pageHeight) throw new Error(`Page block ${b.id} exceeds available height`);
      if (used + h > pageHeight) next();
      pages[pages.length - 1]!.push(f);
      used += h;
      continue;
    }
    let start = 0;
    const breaks = legalTextBreaks(b.text, b.spans);
    while (start < b.text.length) {
      const candidates = breaks.filter((n) => n > start);
      let lo = 0,
        hi = candidates.length - 1,
        best = -1;
      const fragment = (end: number): PageFragment => ({
        blockId: b.id,
        start,
        end,
        spans: slicePageText(b, start, end).spans,
      });
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (measure(fragment(candidates[mid]!)) <= pageHeight - used) {
          best = mid;
          lo = mid + 1;
        } else hi = mid - 1;
      }
      if (best < 0) {
        if (used > 0) {
          next();
          continue;
        }
        throw new Error(`Page text ${b.id} cannot fit its first token`);
      }
      let end = candidates[best]!;
      if (end < b.text.length) {
        const natural = candidates
          .slice(0, best + 1)
          .filter((n) => /[\s.!?]/u.test(b.text[n - 1] ?? ''));
        if (natural.length && natural[natural.length - 1]! > start)
          end = natural[natural.length - 1]!;
      }
      const f = fragment(end);
      pages[pages.length - 1]!.push(f);
      used += measure(f);
      start = end;
      if (start < b.text.length) next();
    }
  }
  return { pages };
}
export function pageForAnchor(layout: PageLayout, anchor: PageAnchor): number {
  const i = layout.pages.findIndex((p) =>
    p.some(
      (f) =>
        f.blockId === anchor.blockId &&
        (f.start === f.end || (f.start <= anchor.offset && f.end > anchor.offset)),
    ),
  );
  return i < 0 ? 0 : i;
}
