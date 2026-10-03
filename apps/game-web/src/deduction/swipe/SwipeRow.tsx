import {
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type Ref,
} from 'react';

type Axis = 'x' | 'y';

/** Where a drag starts: the pointer and the scroll position, both along the row's own axis. */
export function swipeOrigin(
  axis: Axis,
  pointer: { x: number; y: number },
  scroll: { left: number; top: number },
): { start: number; from: number } {
  return axis === 'x'
    ? { start: pointer.x, from: scroll.left }
    : { start: pointer.y, from: scroll.top };
}

/** Where a drag has taken the scroll: under 6px of travel along the axis it is still a click. */
export function swipeScrollFor(
  axis: Axis,
  origin: { start: number; from: number },
  pointer: { x: number; y: number },
): { moved: boolean; scroll: number } {
  const delta = (axis === 'x' ? pointer.x : pointer.y) - origin.start;
  return Math.abs(delta) > 5
    ? { moved: true, scroll: origin.from - delta }
    : { moved: false, scroll: origin.from };
}

/**
 * A row that is swiped sideways (or scrolled up and down): a finger moves it natively, a mouse drags it.
 * No scroll bar, no pages. It is focusable so the arrow keys can move it when it holds nothing else to focus.
 */
export function SwipeRow({
  label,
  className = '',
  axis = 'x',
  scrollRef,
  children,
}: {
  label: string;
  className?: string;
  /** 'x' swipes sideways (default); 'y' scrolls up and down. */
  axis?: Axis;
  scrollRef?: Ref<HTMLDivElement>;
  children: ReactNode;
}): JSX.Element {
  const own = useRef<HTMLDivElement | null>(null);
  const drag = useRef({ active: false, moved: false, start: 0, from: 0 });
  const end = () => {
    if (!drag.current.active) return;
    drag.current.active = false;
    // The click that ends a drag fires right after pointerup: let it be swallowed, then reset.
    setTimeout(() => (drag.current.moved = false), 0);
  };
  // A drag released outside the row (or the window) must still end.
  useEffect(() => {
    window.addEventListener('pointerup', end);
    window.addEventListener('blur', end);
    return () => {
      window.removeEventListener('pointerup', end);
      window.removeEventListener('blur', end);
    };
  }, []);
  const down = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    const row = own.current;
    const origin = swipeOrigin(
      axis,
      { x: event.clientX, y: event.clientY },
      { left: row?.scrollLeft ?? 0, top: row?.scrollTop ?? 0 },
    );
    drag.current = { active: true, moved: false, ...origin };
  };
  const move = (event: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.active || !own.current) return;
    if (event.buttons === 0) return end(); // the button was let go somewhere we did not see
    const next = swipeScrollFor(
      axis,
      { start: d.start, from: d.from },
      { x: event.clientX, y: event.clientY },
    );
    if (next.moved) d.moved = true;
    if (d.moved) {
      if (axis === 'x') own.current.scrollLeft = next.scroll;
      else own.current.scrollTop = next.scroll;
    }
  };
  return (
    <div
      className={`swipe-row swipe-row--${axis} ${className}`.trim()}
      ref={(node) => {
        own.current = node;
        if (typeof scrollRef === 'function') scrollRef(node);
        else if (scrollRef) (scrollRef as { current: HTMLDivElement | null }).current = node;
      }}
      role="group"
      aria-label={label}
      tabIndex={0}
      onFocus={(event) => {
        // Keyboard focus must bring a half-hidden card into view; the browser does not do it for us here.
        const target = event.target as HTMLElement;
        if (target !== event.currentTarget)
          target.scrollIntoView?.({ inline: 'nearest', block: 'nearest' });
      }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onClickCapture={(event) => {
        if (drag.current.moved) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      {children}
    </div>
  );
}
