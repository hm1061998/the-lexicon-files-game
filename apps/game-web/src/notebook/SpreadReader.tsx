import {
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { InkButton } from '@lexicon/ui';
import type { UiStrings } from '@lexicon/shared-types';
import type { PageAnchor, PageFragment, ReaderBlock } from '../investigation/pagination/pageTypes';
import { useMeasuredPages } from '../investigation/pagination/useMeasuredPages';
import { usePaperCue } from '../investigation/pagination/PaperCueContext';
import { PageTurnSurface } from '../investigation/pagination/PageTurnSurface';
import '../investigation/pagination/pagination.css';

const SINGLE_LEAF = '(max-width: 719px), (max-height: 500px)';

/** True when the book shows one leaf at a time (narrow or low screens). */
function useSingleLeaf(): boolean {
  const [single, setSingle] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(SINGLE_LEAF).matches,
  );
  useEffect(() => {
    const query = window.matchMedia(SINGLE_LEAF);
    const update = () => setSingle(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return single;
}

/**
 * One reading laid across the two leaves of the open notebook: the measured pages come in pairs, the even
 * one on the left leaf and the odd one on the right. Turning (buttons, PageUp/PageDown or a horizontal
 * swipe) moves the whole pair, and the page-turn effect sweeps the whole spread. On a single-leaf screen
 * the same pages show one at a time.
 */
export function SpreadReader({
  blocks,
  anchor = null,
  onAnchorChange,
  renderFragment,
  renderMeasurement,
  strings,
  label,
  revision = '',
  empty,
  onPaperCue,
}: {
  blocks: readonly ReaderBlock[];
  anchor?: PageAnchor | null;
  onAnchorChange?: ((a: PageAnchor) => void) | undefined;
  renderFragment: (f: PageFragment) => ReactNode;
  renderMeasurement: (f: PageFragment) => ReactNode;
  strings: UiStrings;
  label: string;
  revision?: string;
  empty?: ReactNode;
  onPaperCue?: (() => void) | undefined;
}): JSX.Element {
  const leftRef = useRef<HTMLDivElement>(null);
  const measurement = useRef<HTMLDivElement>(null);
  const section = useRef<HTMLElement>(null);
  const id = useId();
  const single = useSingleLeaf();
  const { layout, ready, error, pageIndex, goToPage } = useMeasuredPages({
    blocks,
    viewportRef: leftRef,
    measureRef: measurement,
    revision,
    anchor,
    onAnchorChange,
  });
  const paperCue = usePaperCue();
  const [turn, setTurn] = useState({ count: 0, direction: 'forward' as 'forward' | 'backward' });
  const hadFocus = useRef(false);
  const per = single ? 1 : 2;
  const count = layout.pages.length;
  const first = pageIndex - (pageIndex % per);
  const last = Math.min(first + per, count);
  const change = (direction: 1 | -1) => {
    const target = first + direction * per;
    if (target < 0 || target >= count) return;
    hadFocus.current = section.current?.contains(document.activeElement) ?? false;
    goToPage(target);
    paperCue();
    setTurn((t) => ({ count: t.count + 1, direction: direction === 1 ? 'forward' : 'backward' }));
  };
  // A turn can unmount the focused word or disable the focused button: keep focus on a pager button.
  useEffect(() => {
    const root = section.current;
    if (!root || !hadFocus.current) return;
    hadFocus.current = false;
    const active = document.activeElement;
    if (
      active &&
      active !== document.body &&
      root.contains(active) &&
      !(active as HTMLButtonElement).disabled
    )
      return;
    const next = root.querySelector<HTMLElement>('.page-controls button:not(:disabled)');
    (next ?? leftRef.current)?.focus();
  }, [first]);

  // A horizontal swipe turns the pair: left for the next pages, right for the previous ones.
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const down = (event: ReactPointerEvent<HTMLElement>) => {
    swipe.current = { x: event.clientX, y: event.clientY };
  };
  const up = (event: ReactPointerEvent<HTMLElement>) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      change(dx < 0 ? 1 : -1);
      // The click that ends a swipe must not open whatever row the pointer let go over.
      swiped.current = true;
      setTimeout(() => (swiped.current = false), 0);
    }
  };
  // The right leaf is not the one the layout is measured on: if its text still spills (markup that is
  // taller than the measurement copy), hold back height on both leaves and lay out again.
  const rightRef = useRef<HTMLDivElement>(null);
  const signature = JSON.stringify(blocks) + revision;
  const [reserved, setReserved] = useState({ key: signature, px: 0 });
  const reserve = reserved.key === signature ? reserved.px : 0;
  useEffect(() => {
    const right = rightRef.current;
    if (!right || !ready || reserve >= 240) return;
    const frame = requestAnimationFrame(() => {
      if (right.scrollHeight > right.clientHeight + 1)
        setReserved({ key: signature, px: reserve + 24 });
    });
    return () => cancelAnimationFrame(frame);
  }, [ready, layout, first, reserve, signature]);

  const position = strings.pagePosition
    .replace('{current}', last - first > 1 ? `${first + 1}–${last}` : String(first + 1))
    .replace('{total}', String(Math.max(1, count)));
  const fragments = (page: number) =>
    layout.pages[page]?.map((f) => (
      <div
        className="page-fragment"
        data-block-id={f.blockId}
        data-start={f.start}
        data-end={f.end}
        key={`${f.blockId}:${f.start}`}
      >
        {renderFragment(f)}
      </div>
    ));
  const body = (page: number) =>
    blocks.length === 0 ? (
      page === first ? (
        empty
      ) : null
    ) : !ready ? (
      page === first ? (
        <p>{strings.pagePreparing}</p>
      ) : null
    ) : error ? (
      page === first ? (
        <p role="alert">{error}</p>
      ) : null
    ) : (
      fragments(page)
    );
  return (
    <section
      ref={section}
      className="spread-reader measured-page"
      aria-label={label}
      onPointerDown={down}
      onPointerUp={up}
      onPointerCancel={() => (swipe.current = null)}
      onClickCapture={(event) => {
        if (swiped.current) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
      onKeyDown={(e) => {
        if (e.key !== 'PageDown' && e.key !== 'PageUp') return;
        if (
          e.altKey ||
          e.ctrlKey ||
          e.metaKey ||
          e.shiftKey ||
          (e.target as HTMLElement).closest('input,textarea,[contenteditable=true]')
        )
          return;
        // A vocabulary card owns PageUp/PageDown while focus is inside it.
        if ((e.target as HTMLElement).closest('.investigation-vocabulary-popover')) return;
        e.preventDefault();
        e.stopPropagation();
        change(e.key === 'PageDown' ? 1 : -1);
      }}
    >
      <PageTurnSurface
        pageKey={String(turn.count)}
        direction={turn.direction}
        onPaperCue={onPaperCue}
      >
        <div className="spread-leaves">
          <div
            ref={leftRef}
            className="page-viewport spread-leaf spread-leaf--left"
            id={id}
            data-page-index={first}
            tabIndex={-1}
            style={reserve ? { marginBottom: reserve } : undefined}
          >
            {body(first)}
          </div>
          {!single && (
            <div
              ref={rightRef}
              className="page-viewport spread-leaf spread-leaf--right"
              data-page-index={first + 1}
              tabIndex={-1}
              style={reserve ? { marginBottom: reserve } : undefined}
            >
              {body(first + 1)}
            </div>
          )}
        </div>
      </PageTurnSurface>
      <div ref={measurement} className="page-measurement" aria-hidden="true">
        {blocks.map((b) => {
          const f = {
            blockId: b.id,
            start: 0,
            end: b.kind === 'text' ? b.text.length : 0,
            spans: b.kind === 'text' ? b.spans : [],
          };
          return (
            <div className="page-fragment" data-measure-id={b.id} key={b.id}>
              {renderMeasurement(f)}
            </div>
          );
        })}
      </div>
      <nav className="page-controls spread-controls" aria-label={label}>
        <InkButton
          sfx="paper-close"
          aria-label={`${label}: ${strings.pagePrevious}`}
          disabled={first <= 0}
          onClick={() => change(-1)}
        >
          ‹
        </InkButton>
        <span className="page-controls__label" aria-live="polite">
          {position}
        </span>
        <i className="spread-controls__gap" aria-hidden="true" />
        {!single && (
          <em className="page-controls__label page-controls__label--echo" aria-hidden="true">
            {position}
          </em>
        )}
        <InkButton
          sfx="paper-open"
          aria-label={`${label}: ${strings.pageNext}`}
          disabled={first + per >= count}
          onClick={() => change(1)}
        >
          ›
        </InkButton>
      </nav>
    </section>
  );
}
