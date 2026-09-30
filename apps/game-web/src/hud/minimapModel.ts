import type { SceneDefinition } from '@lexicon/shared-types';

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

/** Pure projection of a scene definition (world coordinates) into minimap primitives. */
export function buildMinimapModel(
  scene: SceneDefinition,
  playerPosition: { x: number; y: number } | null,
): MinimapModel {
  const b = scene.worldBounds;
  const solids: MinimapRect[] = [];
  const partitions: MinimapRect[] = [];
  const markers: MinimapMarker[] = [];
  for (const asset of scene.assets) {
    const c = asset.collision;
    if (c) {
      const rect = { x: asset.x + c.x, y: asset.y + c.y, width: c.width, height: c.height };
      // The back wall spans the whole world; any narrower wall divides rooms.
      const partition = asset.type === 'wall' && c.width < b.width;
      (partition ? partitions : solids).push(rect);
    }
    const interaction = asset.interaction;
    if (interaction) {
      const kind = interaction.transition
        ? 'door'
        : asset.type === 'npc' || interaction.npcId
          ? 'npc'
          : 'interactable';
      markers.push({
        id: asset.id,
        x: asset.x + interaction.x,
        y: asset.y + interaction.y,
        kind,
      });
    }
  }
  const currentRoom = playerPosition
    ? (scene.labels ?? []).reduce<{ text: string; distance: number } | null>((nearest, label) => {
        const distance = Math.hypot(playerPosition.x - label.x, playerPosition.y - label.y);
        return !nearest || distance < nearest.distance ? { text: label.text, distance } : nearest;
      }, null)
    : null;
  return {
    viewBox: `${b.x} ${b.y} ${b.width} ${b.height}`,
    markerRadius: (b.width * 88) / 2400,
    playerRadius: (b.width * 84) / 2400,
    solids,
    partitions,
    labels: (scene.labels ?? []).map(({ id, text, x, y }) => ({ id, text, x, y })),
    currentRoomName: currentRoom?.text ?? null,
    markers,
    player: playerPosition ? { x: playerPosition.x, y: playerPosition.y } : null,
  };
}
