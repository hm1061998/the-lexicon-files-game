import type { Effect } from './case-engine';

/** A texture key and the public URL it is loaded from (always under `/assets/`). */
export interface TextureEntry {
  readonly key: string;
  readonly url: string;
  /** Set (with `frameHeight`) when the file is a spritesheet of equal frames. */
  readonly frameWidth?: number | undefined;
  readonly frameHeight?: number | undefined;
}

export type CharacterFacing = 'NE' | 'SE' | 'SW' | 'NW';

/** Texture key per facing for a character, declared in content. */
export type FacingTextureMap = Readonly<Record<CharacterFacing, string>>;

/**
 * Textures of one character: an idle still per facing and, optionally, a walk spritesheet
 * (8 columns x 4 rows NE, SE, SW, NW; see docs/art/07 "Walk sheet"). `walk: null` keeps the
 * idle still while moving.
 */
export interface CharacterSheet {
  readonly idle: FacingTextureMap;
  readonly walk: string | null;
}

/** Character sheets by character name; `player` is always present. */
export type CharacterSheets = { readonly player: CharacterSheet } & Readonly<
  Record<string, CharacterSheet>
>;

export type SceneAssetType = 'background' | 'wall' | 'prop' | 'interactable' | 'npc';

/** Fixed 2:1 dimetric projection for content positions stored on the logical floor plane. */
export interface IsoProjection {
  readonly type: 'dimetric-2:1';
  readonly originX: number;
  readonly originY: number;
  readonly tileWidth: 128;
  readonly tileHeight: 64;
}

export interface RectCollision {
  readonly type: 'rect';
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface InteractionArea {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly prompt: string;
  readonly npcId?: string | undefined;
  readonly effects?: readonly Effect[] | undefined;
  readonly transition?: SceneTransitionDefinition | undefined;
}

export interface SceneTransitionDefinition {
  readonly targetSceneId: string;
  readonly targetSpawnId: string;
}

export interface SpawnPointDefinition {
  readonly x: number;
  readonly y: number;
}

export interface SceneAssetDefinition {
  readonly id: string;
  readonly type: SceneAssetType;
  readonly texture: string;
  readonly x: number;
  readonly y: number;
  readonly origin: readonly [number, number];
  /** Uniform display scale of the texture; collision/interaction stay in world pixels. */
  readonly scale: number;
  readonly depth?: number | undefined;
  readonly depthBias: number;
  readonly collision?: RectCollision | undefined;
  readonly interaction?: InteractionArea | undefined;
}

/**
 * A room sign drawn in the world (e.g. on a partition wall). Text comes from content; the label
 * is decoration only: not interactive and without game logic.
 */
export interface SceneLabelDefinition {
  readonly id: string;
  readonly text: string;
  /** Centre of the sign in world pixels. */
  readonly x: number;
  readonly y: number;
  /** Rotation in degrees, clockwise. */
  readonly angle?: number | undefined;
}

export interface SceneDefinition {
  readonly id: string;
  /** Optional during migration; legacy scenes continue to use world pixel coordinates. */
  readonly projection?: IsoProjection | undefined;
  readonly size: { readonly width: number; readonly height: number };
  readonly worldBounds: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
  readonly spawnPoints: Readonly<Record<string, SpawnPointDefinition>>;
  /** Textures this scene's assets use; loaded when the scene is entered. `ph_*` are generated. */
  readonly textures: readonly TextureEntry[];
  readonly assets: readonly SceneAssetDefinition[];
  readonly labels?: readonly SceneLabelDefinition[] | undefined;
}
