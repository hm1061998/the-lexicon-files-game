import { useEffect, useId, useRef, type ReactNode } from 'react';
import type { UiStrings } from '@lexicon/shared-types';
import type { PageAnchor, PageFragment, ReaderBlock } from './pageTypes';
import { useMeasuredPages } from './useMeasuredPages';
import { PageControls } from './PageControls';
import { usePaperCue } from './PaperCueContext';
import './pagination.css';
export function MeasuredPage({
  blocks,
  anchor = null,
  onAnchorChange,
  renderFragment,
  renderMeasurement,
  strings,
  controlsLabel,
  revision = '',
  onPageTurn,
  empty,
}: {
  blocks: readonly ReaderBlock[];
  anchor?: PageAnchor | null;
  onAnchorChange?: ((a: PageAnchor) => void) | undefined;
  renderFragment: (f: PageFragment) => ReactNode;
  renderMeasurement: (f: PageFragment) => ReactNode;
  strings: UiStrings;
  controlsLabel: string;
  revision?: string;
  onPageTurn?: (() => void) | undefined;
  empty?: ReactNode;
}) {
  const viewport = useRef<HTMLDivElement>(null),
    measurement = useRef<HTMLDivElement>(null);
  const id = useId();
  const { layout, ready, error, pageIndex, goToPage } = useMeasuredPages({
    blocks,
    viewportRef: viewport,
    measureRef: measurement,
    revision,
    anchor,
    onAnchorChange,
  });
  const paperCue = usePaperCue();
  const section = useRef<HTMLElement>(null);
  const hadFocus = useRef(false);
  const change = (n: number) => {
    if (n === pageIndex || n < 0 || n >= layout.pages.length) return;
    hadFocus.current = section.current?.contains(document.activeElement) ?? false;
    goToPage(n);
    paperCue();
    onPageTurn?.();
  };
  // A page turn can unmount the focused word or disable the focused pager button: keep focus on the
  // pager (or the page itself) instead of dropping it to the document body.
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
    (next ?? viewport.current)?.focus();
  }, [pageIndex]);
  return (
    <section
      ref={section}
      className="measured-page"
      aria-label={controlsLabel}
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
        // A vocabulary popover owns PageUp/PageDown while focus is inside it; only its own pages react.
        const popover = (e.target as HTMLElement).closest('.investigation-vocabulary-popover');
        if (popover && !e.currentTarget.closest('.investigation-vocabulary-popover')) return;
        e.preventDefault();
        e.stopPropagation();
        change(pageIndex + (e.key === 'PageDown' ? 1 : -1));
      }}
    >
      <div
        ref={viewport}
        className="page-viewport"
        id={id}
        data-page-index={pageIndex}
        tabIndex={-1}
      >
        {blocks.length === 0 ? (
          empty
        ) : !ready ? (
          <p>{strings.pagePreparing}</p>
        ) : error ? (
          <p role="alert">{error}</p>
        ) : (
          layout.pages[pageIndex]?.map((f) => (
            <div
              className="page-fragment"
              data-block-id={f.blockId}
              data-start={f.start}
              data-end={f.end}
              key={`${f.blockId}:${f.start}`}
            >
              {renderFragment(f)}
            </div>
          ))
        )}
      </div>
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
      <PageControls
        index={pageIndex}
        count={layout.pages.length}
        label={controlsLabel}
        strings={strings}
        onChange={change}
      />
    </section>
  );
}
