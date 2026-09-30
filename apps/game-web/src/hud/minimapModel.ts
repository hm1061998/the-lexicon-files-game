import type { SceneDefinition } from '@lexicon/shared-types';
import { expandWalls } from '@lexicon/game-content';
import {
  projectScenePoint,
  projectVisualAnchor,
  projectWorldBounds,
} from '../game/systems/sceneProjection';
import { resolveSceneAssets } from '../game/systems/sceneAssetResolver';

export type MinimapRect = { x: number; y: number; width: number; height: number };
export type MinimapMarker = {
  id: string;
  x: number;
  y: number;
  kind: 'interactable' | 'door' | 'npc';
};
export type MinimapLabel = { id: string; text: string; x: number; y: number };
export type MinimapModel = {
  viewBox: string;
  floorPoints: string;
  markerRadius: number;
  playerRadius: number;
  solids: MinimapRect[];
  /** Inner room walls (`wall` assets narrower than the world), drawn with a heavier stroke. */
  partitions: MinimapRect[];
  /** Room label positions; the map shows a dot, not the text. */
  labels: MinimapLabel[];
  currentRoomName: string | null;
  markers: MinimapMarker[];
  player: { x: number; y: number } | null;
};

type PlayerPosition = { x: number; y: number; coordinateSpace?: 'screen' | 'logical' };

/** Converts scene geometry and player position into a single screen-space minimap view. */
export function buildMinimapModel(
  scene: SceneDefinition,
  playerPosition: PlayerPosition | null,
): MinimapModel {
  const b = scene.worldBounds;
  let projectedBounds: MinimapRect;
  let floorCorners: Array<{ x: number; y: number }>;
  if ('u' in b) {
    if (!scene.projection)
      throw new Error(`Scene "${scene.id}" has logical bounds without projection metadata`);
    projectedBounds = projectWorldBounds(b, scene.projection);
    floorCorners = [
      projectScenePoint(scene, { u: b.u, v: b.v }),
      projectScenePoint(scene, { u: b.u + b.width, v: b.v }),
      projectScenePoint(scene, { u: b.u + b.width, v: b.v + b.height }),
      projectScenePoint(scene, { u: b.u, v: b.v + b.height }),
    ];
  } else {
    projectedBounds = b;
    floorCorners = [
      { x: b.x, y: b.y },
      { x: b.x + b.width, y: b.y },
      { x: b.x + b.width, y: b.y + b.height },
      { x: b.x, y: b.y + b.height },
    ];
  }
  const solids: MinimapRect[] = [];
  const partitions: MinimapRect[] = [];
  const markers: MinimapMarker[] = [];
  for (const resolved of resolveSceneAssets([...scene.assets, ...expandWalls(scene.walls ?? []).assets])) {
    const { asset, floorAnchor, collision, interactionAnchor } = resolved;
    if (collision) {
      let rect: MinimapRect;
      if ('u' in collision && 'u' in floorAnchor && scene.projection) {
        rect = projectWorldBounds(
          {
            u: floorAnchor.u + collision.u,
            v: floorAnchor.v + collision.v,
            width: collision.width,
            height: collision.height,
          },
          scene.projection,
        );
      } else if ('x' in collision && 'x' in floorAnchor) {
        rect = {
          x: floorAnchor.x + collision.x,
          y: floorAnchor.y + collision.y,
          width: collision.width,
          height: collision.height,
        };
      } else {
        throw new Error(`scene asset "${asset.id}" has collision in a different coordinate space`);
      }
      const partition = asset.type === 'wall' && (asset.wallSpan ?? collision.width) < b.width;
      (partition ? partitions : solids).push(rect);
    }
    if (asset.interaction && interactionAnchor) {
      const point = projectVisualAnchor(scene, interactionAnchor);
      const kind = asset.interaction.transition
        ? 'door'
        : asset.type === 'npc' || asset.interaction.npcId
          ? 'npc'
          : 'interactable';
      markers.push({ id: asset.id, x: point.x, y: point.y, kind });
    }
  }
  const player = playerPosition
    ? playerPosition.coordinateSpace === 'logical'
      ? projectScenePoint(scene, { u: playerPosition.x, v: playerPosition.y })
      : { x: playerPosition.x, y: playerPosition.y }
    : null;
  const labels = (scene.labels ?? []).map((label) => {
    const point =
      'u' in label
        ? projectScenePoint(scene, { u: label.u, v: label.v })
        : { x: label.x, y: label.y };
    return { id: label.id, text: label.text, ...point };
  });
  const currentRoom = player
    ? labels.reduce<{ text: string; distance: number } | null>((nearest, label) => {
        const distance = Math.hypot(player.x - label.x, player.y - label.y);
        return !nearest || distance < nearest.distance ? { text: label.text, distance } : nearest;
      }, null)
    : null;
  return {
    viewBox: `${projectedBounds.x} ${projectedBounds.y} ${projectedBounds.width} ${projectedBounds.height}`,
    floorPoints: floorCorners.map(({ x, y }) => `${x},${y}`).join(' '),
    markerRadius: (b.width * 88) / 2400,
    playerRadius: (b.width * 84) / 2400,
    solids,
    partitions,
    labels,
    currentRoomName: currentRoom?.text ?? null,
    markers,
    player,
  };
}
