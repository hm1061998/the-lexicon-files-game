import { useEffect, type RefObject } from 'react';
import { useGameStoreApi } from '../state/GameStoreContext';
import { computeHudInsets } from './hudInsets';

const MEASURED = '.hud-objective-panel, .hud-case-progress, .hud-minimap, .hud-key-hints';

/** Publishes how much screen the HUD blocks cover, for Phaser to read through the store. */
export function useHudInsets(hudRef: RefObject<HTMLElement>): void {
  const store = useGameStoreApi();
  useEffect(() => {
    const hud = hudRef.current;
    if (!hud || typeof ResizeObserver === 'undefined') return;
    const measure = (): void => {
      const origin = hud.getBoundingClientRect();
      const rects = [...hud.querySelectorAll(MEASURED)].map((el) => {
        const r = el.getBoundingClientRect();
        return {
          left: r.left - origin.left,
          top: r.top - origin.top,
          right: r.right - origin.left,
          bottom: r.bottom - origin.top,
        };
      });
      store.getState().setHudInsets(computeHudInsets(origin, rects));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(hud);
    hud.querySelectorAll(MEASURED).forEach((el) => observer.observe(el));
    // Blocks appear and disappear (collapse, evidence count); re-measure on DOM changes too.
    const mutations = new MutationObserver(() => {
      measure();
      observer.disconnect();
      observer.observe(hud);
      hud.querySelectorAll(MEASURED).forEach((el) => observer.observe(el));
    });
    mutations.observe(hud, { childList: true, subtree: true });
    measure();
    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, [hudRef, store]);
}
