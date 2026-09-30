export type LexiconDebug = {
  player(): { x: number; y: number; depth: number };
  playerTexture(): string;
  /** Walk animation on the player: key and 0-based frame while playing, nulls when idle. */
  playerAnim(): { key: string | null; frame: number | null; playing: boolean };
  depthOf(id: string): number;
  /** Texture key currently rendered for a scene asset (including `ph_missing` fallbacks). */
  textureOf(id: string): string | undefined;
  /** Texts of the room labels drawn in the current scene, in content order. */
  labels(): string[];
  /** Current alpha of an occluding wall/board (NaN for any other id). */
  alphaOf(id: string): number;
  nearby(): string | null;
  nearbyEvents(): number;
  triggeredEvents(): number;
  teleport(x: number, y: number): void;
  markerY(): number | null;
  /** World-space rectangle of the red target outline, or null while it is hidden. */
  highlightBounds(): { x: number; y: number; width: number; height: number } | null;
  /** Anchor the marker rests on when the float offset is zero, or null while hidden. */
  markerBaseY(): number | null;
  paperOverlayAlpha(): number | null;
  /** Requests a transition through the real flow (store first, then the bus). */
  requestTransition(sceneId: string, spawnId: string): void;
  /** `activeSceneId` of the game store; must match the scene Phaser shows once settled. */
  storeSceneId(): string;
};

declare global {
  interface Window {
    __lexiconDebug?: LexiconDebug;
  }
}

/** Opacity of the CSS paper grain layer, or null when it is absent (e.g. `?noPaperOverlay`). */
export function paperOverlayAlpha(): number | null {
  const overlay = document.querySelector('.game-paper-overlay');
  return overlay ? Number(getComputedStyle(overlay).opacity) : null;
}

/** Dev-only test hook; stripped from production builds via `import.meta.env.DEV`. */
export function installDebugHook(api: LexiconDebug): () => void {
  if (!import.meta.env.DEV) return () => {};
  window.__lexiconDebug = api;
  return () => {
    if (window.__lexiconDebug === api) delete window.__lexiconDebug;
  };
}
