export type LexiconDebug = {
  /** Last accepted canvas pointer conversion; read-only diagnostic, dev builds only. */
  pointerState(): { x: number; y: number; targetId: string | null; status: string } | null;
  cameraState(): {
    zoom: number;
    scrollX: number;
    scrollY: number;
    view: { x: number; y: number; width: number; height: number };
    bounds: { x: number; y: number; width: number; height: number };
  };
  player(): { x: number; y: number; depth: number };
  logicalPlayer(): { u: number; v: number } | null;
  playerTexture(): string;
  /** Walk animation on the player: key and 0-based frame while playing, nulls when idle. */
  playerAnim(): { key: string | null; frame: number | null; playing: boolean };
  depthOf(id: string): number;
  /** Texture key currently rendered for a scene asset (including `ph_missing` fallbacks). */
  textureOf(id: string): string | undefined;
  npcTexture(id: string): string | undefined;
  npcScaleY(id: string): number | undefined;
  npcName(id: string): string | undefined;
  /** Whether the NPC's dossier tag is meant to be showing (distance or hover). */
  nameplateVisible(id: string): boolean;
  npcNameplate(
    id: string,
  ): { text: string; hasPaperPlate: boolean; textColor: string; gap: number } | undefined;
  npcAnim(id: string): { key: string | null; frame: number | null; playing: boolean } | undefined;
  setNpcWalking(id: string, walking: boolean): void;
  /** Texts of the room labels drawn in the current scene, in content order. */
  labels(): string[];
  /** Generated room-sign textures currently owned by the renderer. */
  labelTextureCount(): number;
  /** Textures in the Phaser cache, excluding Phaser built-ins (`__DEFAULT` etc.). */
  textureCount(): number;
  /** Listeners on the scene's events and input plus the scale manager and game events it subscribes to. */
  listenerCount(): number;
  /** Current camera zoom, including the conversation push-in. */
  cameraZoom(): number;
  /** Camera zoom without the push-in. */
  cameraBaseZoom(): number;
  /** Visible world cue markers currently owned by the active scene. */
  worldCueCount(): number;
  /** Which arch drawing a portal asset uses: `ne`, `nw`, or the mirrored `-flip` copy. */
  portalFacing(id: string): 'ne' | 'nw' | 'ne-flip' | 'nw-flip' | undefined;
  /** Ids of the cues that currently have an edge pointer (outside the camera view). */
  offscreenCueIds(): string[];
  /** Current alpha of an occluding wall/board (NaN for any other id). */
  alphaOf(id: string): number;
  nearby(): string | null;
  nearbyEvents(): number;
  triggeredEvents(): number;
  /** Count of `paper` audio cues seen on the bus since the scene started (dev only). */
  paperCues(): number;
  teleport(x: number, y: number): void;
  teleportLogical(u: number, v: number): void;
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
