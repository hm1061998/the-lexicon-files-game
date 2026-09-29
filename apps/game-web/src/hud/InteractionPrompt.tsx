import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Keycap, PaperPanel } from '@lexicon/ui';
import type { UiStrings } from '@lexicon/shared-types';
import { canAnchorBubble, placeBubble, type Point, type Rect } from '../game/systems/anchorScreen';
import { useGameStore } from '../state/GameStoreContext';

const VIEWPORT_MARGIN = 8;
// useLayoutEffect warns during server rendering (the unit tests); the browser gets the layout one.
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const AVOID_SELECTORS = [
  '.hud-minimap',
  '.hud-objective-panel',
  '.hud-case-progress',
  '.hud-key-hints',
];

type Placement = { pos: Point; anchor: Point };

function relativeRect(el: Element, origin: DOMRect): Rect {
  const r = el.getBoundingClientRect();
  return {
    left: r.left - origin.left,
    top: r.top - origin.top,
    right: r.right - origin.left,
    bottom: r.bottom - origin.top,
  };
}

export function InteractionPrompt({ strings }: { strings: UiStrings }): JSX.Element | null {
  const nearby = useGameStore((state) => state.nearby);
  const anchor = useGameStore((state) => state.interactionAnchor);
  const locked = useGameStore((state) => state.inputLocked);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [resizeTick, setResizeTick] = useState(0);

  useIsoLayoutEffect(() => {
    const onResize = () => setResizeTick((tick) => tick + 1);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const showing = nearby !== null && !locked && anchor !== null;
  useIsoLayoutEffect(() => {
    const hud = bubbleRef.current?.closest('.hud');
    if (!showing || !hud || typeof ResizeObserver === 'undefined') return;
    // The objective text and other HUD blocks can change size while the bubble stays.
    const observer = new ResizeObserver(() => setResizeTick((tick) => tick + 1));
    for (const selector of AVOID_SELECTORS) {
      hud.querySelectorAll(selector).forEach((el) => observer.observe(el));
    }
    return () => observer.disconnect();
  }, [showing]);

  const measure = useCallback(() => {
    const bubble = bubbleRef.current;
    const hud = bubble?.closest('.hud');
    const canvas = hud?.parentElement?.querySelector('canvas');
    if (!bubble || !hud || !canvas || !anchor) return null;
    const origin = hud.getBoundingClientRect();
    if (!canAnchorBubble(origin.width)) return null;
    const canvasRect = canvas.getBoundingClientRect();
    // The anchor is canvas-relative CSS px; the canvas can be letterboxed inside the HUD.
    const point = {
      x: canvasRect.left - origin.left + anchor.x,
      y: canvasRect.top - origin.top + anchor.y,
    };
    const size = { width: bubble.offsetWidth, height: bubble.offsetHeight };
    const avoid = AVOID_SELECTORS.flatMap((selector) =>
      Array.from(hud.querySelectorAll(selector), (el) => relativeRect(el, origin)),
    );
    const pos = placeBubble(
      point,
      size,
      { width: origin.width, height: origin.height },
      VIEWPORT_MARGIN,
      avoid,
    );
    return pos ? { pos, anchor: { x: point.x + origin.left, y: point.y + origin.top } } : null;
  }, [anchor]);

  useIsoLayoutEffect(() => {
    const next = nearby ? measure() : null;
    setPlacement((prev) =>
      prev === next || (prev && next && prev.pos.x === next.pos.x && prev.pos.y === next.pos.y)
        ? prev
        : next,
    );
  }, [nearby, measure, resizeTick]);

  // Modals, pause and a closed case lock input: no prompt behind them.
  if (!nearby || locked) {
    return null;
  }
  // Wide screens wait for the first anchor so the prompt never flashes at the fallback spot.
  if (!anchor && typeof window !== 'undefined' && canAnchorBubble(window.innerWidth)) {
    return null;
  }

  const anchored = placement !== null;
  return (
    <div
      ref={bubbleRef}
      className={
        anchored ? 'hud-interaction-prompt hud-interaction-bubble' : 'hud-interaction-prompt'
      }
      style={anchored ? { left: placement.pos.x, top: placement.pos.y } : undefined}
      data-anchor-x={anchored ? Math.round(placement.anchor.x) : undefined}
      data-anchor-y={anchored ? Math.round(placement.anchor.y) : undefined}
    >
      <PaperPanel as="div" className="hud-interaction-paper">
        <div role="status" aria-live="polite">
          <Keycap>E</Keycap>
          <span className="hud-interaction-prompt-text" aria-label={strings.interact}>
            {nearby.prompt}
          </span>
        </div>
      </PaperPanel>
    </div>
  );
}
