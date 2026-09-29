import type { SceneDefinition } from '@lexicon/shared-types';

export type MinimapRect = { x: number; y: number; width: number; height: number };
export type MinimapMarker = {
  id: string;
  x: number;
  y: number;
  kind: 'interactable' | 'door' | 'npc';
};
export type MinimapModel = {
  viewBox: string;
  solids: MinimapRect[];
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
  const markers: MinimapMarker[] = [];
  for (const asset of scene.assets) {
    const c = asset.collision;
    if (c) {
      solids.push({ x: asset.x + c.x, y: asset.y + c.y, width: c.width, height: c.height });
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
  return {
    viewBox: `${b.x} ${b.y} ${b.width} ${b.height}`,
    solids,
    markers,
    player: playerPosition ? { x: playerPosition.x, y: playerPosition.y } : null,
  };
}
