import type { Effect } from './case-engine';

export type SceneAssetType = 'background' | 'wall' | 'prop' | 'interactable' | 'npc';

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

export interface SceneDefinition {
  readonly id: string;
  readonly size: { readonly width: number; readonly height: number };
  readonly worldBounds: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
  readonly spawnPoints: Readonly<Record<string, SpawnPointDefinition>>;
  readonly assets: readonly SceneAssetDefinition[];
}
