import { useRef, type PointerEvent as ReactPointerEvent, type ReactNode, type Ref } from 'react';

/**
 * A row that is swiped sideways: a finger swipes it natively, a mouse drags it. No scroll bar, no pages.
 * It is focusable so the arrow keys can move it when it holds nothing else to focus.
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
  axis?: 'x' | 'y';
  scrollRef?: Ref<HTMLDivElement>;
  children: ReactNode;
}): JSX.Element {
  const own = useRef<HTMLDivElement | null>(null);
  const drag = useRef({ active: false, moved: false, x: 0, left: 0 });
  const down = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    drag.current = {
      active: true,
      moved: false,
      x: event.clientX,
      left: own.current?.scrollLeft ?? 0,
    };
  };
  const move = (event: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.active || !own.current) return;
    const dx = (axis === 'x' ? event.clientX : event.clientY) - d.x;
    if (Math.abs(dx) > 5) d.moved = true;
    if (d.moved) {
      if (axis === 'x') own.current.scrollLeft = d.left - dx;
      else own.current.scrollTop = d.left - dx;
    }
  };
  const up = () => {
    drag.current.active = false;
    // The click that ends a drag fires right after pointerup: let it be swallowed, then reset.
    setTimeout(() => (drag.current.moved = false), 0);
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
      onPointerUp={up}
      onPointerCancel={up}
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
