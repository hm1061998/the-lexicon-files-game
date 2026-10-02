import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import type { PageAnchor, PageFragment, PageLayout, ReaderBlock } from './pageTypes';
import { paginateBlocks, pageForAnchor } from './paginateBlocks';
export function useMeasuredPages({
  blocks,
  viewportRef,
  measureRef,
  revision,
  anchor,
  onAnchorChange,
}: {
  blocks: readonly ReaderBlock[];
  viewportRef: RefObject<HTMLElement>;
  measureRef: RefObject<HTMLElement>;
  revision: string;
  anchor: PageAnchor | null;
  onAnchorChange?: ((a: PageAnchor) => void) | undefined;
}) {
  const signature = JSON.stringify(blocks);
  const stableBlocks = useMemo(() => JSON.parse(signature) as ReaderBlock[], [signature]);
  const [state, setState] = useState<{
    layout: PageLayout;
    ready: boolean;
    error: string | null;
    blocks: readonly ReaderBlock[] | null;
  }>({ layout: { pages: [[]] }, ready: false, error: null, blocks: null });
  const [localAnchor, setLocalAnchor] = useState<PageAnchor | null>(anchor);
  // New content (another dossier, another word) opens on its first page, never a stale local anchor.
  useEffect(() => setLocalAnchor(null), [signature]);
  // Extra height held back after a visible page was seen spilling; keyed to the content it was learned on.
  const reserveKey = signature + revision;
  const [reserveState, setReserve] = useState({ key: reserveKey, px: 0 });
  const reserve = reserveState.key === reserveKey ? reserveState.px : 0;
  const anchorRef = useRef(anchor);
  anchorRef.current = anchor ?? localAnchor;
  useEffect(() => {
    const viewport = viewportRef.current,
      root = measureRef.current;
    if (!viewport || !root) return;
    const measuredBlocks = stableBlocks;
    root.inert = true;
    let stopped = false,
      frame = 0;
    const layout = () => {
      if (stopped) return;
      // The viewport has 4px padding on every side; measure at the width the fragments really get.
      const height = viewport.clientHeight - 8 - reserve,
        width = viewport.clientWidth - 8;
      if (height <= 0 || width <= 0) return;
      root.style.width = `${width}px`;
      const measure = (f: PageFragment) => {
        const source = Array.from(root.children).find(
          (n) => (n as HTMLElement).dataset.measureId === f.blockId,
        ) as HTMLElement | undefined;
        if (!source) return 0;
        const clone = source.cloneNode(true) as HTMLElement;
        const block = measuredBlocks.find((b) => b.id === f.blockId);
        if (block?.kind === 'text') {
          const text = clone.querySelector('[data-measure-text]') ?? clone;
          text.textContent = block.text.slice(f.start, f.end);
        }
        root.append(clone);
        const h = clone.getBoundingClientRect().height + 8;
        clone.remove();
        return h;
      };
      try {
        const result = paginateBlocks(measuredBlocks, height, measure);
        setState({ layout: result, ready: true, error: null, blocks: stableBlocks });
      } catch (e) {
        setState({
          layout: { pages: [[]] },
          ready: true,
          error: e instanceof Error ? e.message : String(e),
          blocks: stableBlocks,
        });
      }
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(layout);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(viewport);
    const fonts = document.fonts?.ready ?? Promise.resolve();
    void fonts.then(() => {
      if (!stopped) schedule();
    });
    const images = Array.from(root.querySelectorAll('img'));
    for (const img of images) {
      img.addEventListener('load', schedule);
      img.addEventListener('error', schedule);
    }
    schedule();
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      for (const img of images) {
        img.removeEventListener('load', schedule);
        img.removeEventListener('error', schedule);
      }
    };
  }, [stableBlocks, revision, viewportRef, measureRef, reserve]);
  const settled = state.blocks === stableBlocks && state.ready;
  const current = anchor ?? localAnchor;
  useEffect(() => {
    // Visible markup (vocabulary buttons) can wrap differently from the plain measurement text:
    // if the shown page spills, hold back one more line and lay out again.
    const viewport = viewportRef.current;
    if (!viewport || !settled) return;
    const frame = requestAnimationFrame(() => {
      if (viewport.scrollHeight > viewport.clientHeight + 1 && reserve < 240)
        setReserve({ key: reserveKey, px: reserve + 24 });
    });
    return () => cancelAnimationFrame(frame);
  }, [settled, state.layout, current?.blockId, current?.offset, reserve, reserveKey, viewportRef]);
  const pageIndex = current ? pageForAnchor(state.layout, current) : 0;
  const goToPage = (n: number) => {
    const page = state.layout.pages[Math.max(0, Math.min(n, state.layout.pages.length - 1))];
    const f = page?.[0];
    if (f) {
      const a = { blockId: f.blockId, offset: f.start };
      setLocalAnchor(a);
      onAnchorChange?.(a);
    }
  };
  return {
    ...state,
    layout: state.blocks === stableBlocks ? state.layout : { pages: [[]] },
    ready: state.blocks === stableBlocks && state.ready,
    pageIndex: state.blocks === stableBlocks ? pageIndex : 0,
    goToPage,
  };
}
