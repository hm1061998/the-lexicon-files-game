import { useEffect, useState, type RefObject } from 'react';
import type { InvestigationRelationship } from '../investigation/selectInvestigationView';
export function connectionCoordinates(
  a: { left: number; top: number; width: number; height: number },
  b: { left: number; top: number; width: number; height: number },
  origin: { left: number; top: number; scrollLeft?: number; scrollTop?: number },
) {
  return {
    x1: a.left + a.width / 2 - origin.left + (origin.scrollLeft ?? 0),
    y1: a.top + a.height / 2 - origin.top + (origin.scrollTop ?? 0),
    x2: b.left + b.width / 2 - origin.left + (origin.scrollLeft ?? 0),
    y2: b.top + b.height / 2 - origin.top + (origin.scrollTop ?? 0),
  };
}
export function DeductionConnections({
  relationships,
  surface,
}: {
  relationships: readonly InvestigationRelationship[];
  surface: RefObject<HTMLDivElement>;
}) {
  const [lines, setLines] = useState<ReturnType<typeof connectionCoordinates>[]>([]);
  useEffect(() => {
    const root = surface.current;
    if (!root) return;
    const update = () => {
      const nodes = new Map(
        Array.from(root.querySelectorAll<HTMLElement>('[data-board-node]'))
          .filter((n) => !n.closest('.page-measurement') && n.getClientRects().length > 0)
          .map((n) => [n.dataset.boardNode, n]),
      );
      const bounds = root.getBoundingClientRect();
      const origin = {
        left: bounds.left,
        top: bounds.top,
        scrollTop: root.scrollTop,
        scrollLeft: root.scrollLeft,
      };
      setLines(
        relationships.flatMap((r) => {
          const a = nodes.get(r.from),
            b = nodes.get(r.to);
          return a && b
            ? [connectionCoordinates(a.getBoundingClientRect(), b.getBoundingClientRect(), origin)]
            : [];
        }),
      );
    };
    update();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    observer?.observe(root);
    root.querySelectorAll('[data-board-node]').forEach((n) => observer?.observe(n));
    const mutation = new MutationObserver(update);
    mutation.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-pressed'],
    });
    // Pinned cards settle (enter animation, hover lift) after layout: re-aim the lines when they stop.
    root.addEventListener('animationend', update);
    root.addEventListener('transitionend', update);
    window.addEventListener('resize', update);
    root.addEventListener('scroll', update, true);
    return () => {
      observer?.disconnect();
      mutation.disconnect();
      window.removeEventListener('resize', update);
      root.removeEventListener('animationend', update);
      root.removeEventListener('transitionend', update);
      root.removeEventListener('scroll', update, true);
    };
  }, [relationships, surface]);
  return (
    <svg className="deduction-connections" aria-hidden="true">
      {lines.map((line, i) => (
        <line key={i} {...line} />
      ))}
    </svg>
  );
}
