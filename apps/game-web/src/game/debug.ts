export type LexiconDebug = {
  player(): { x: number; y: number; depth: number };
  depthOf(id: string): number;
  nearby(): string | null;
  nearbyEvents(): number;
  triggeredEvents(): number;
  teleport(x: number, y: number): void;
  markerY(): number | null;
};

declare global {
  interface Window {
    __lexiconDebug?: LexiconDebug;
  }
}

/** Dev-only test hook; stripped from production builds via `import.meta.env.DEV`. */
export function installDebugHook(api: LexiconDebug): () => void {
  if (!import.meta.env.DEV) return () => {};
  window.__lexiconDebug = api;
  return () => {
    if (window.__lexiconDebug === api) delete window.__lexiconDebug;
  };
}
