import type { SceneDefinition, SceneLabelDefinition } from '@lexicon/shared-types';
import { projectScenePoint } from './sceneProjection';
type Point = { x: number; y: number };
export type LabelPlane = { anchor: Point; basisX: Point; basisY: Point; depth: number };
export function resolveLabelPlane(
  label: SceneLabelDefinition,
  definition: SceneDefinition,
): LabelPlane {
  const point = projectScenePoint(definition, label);
  if (label.mount?.kind === 'floor') {
    const floorDepth = definition.assets
      .filter((a) => a.type === 'background')
      .reduce((max, a) => Math.max(max, a.depth ?? 0), 0);
    return {
      anchor: point,
      basisX: { x: 1, y: 0.5 },
      basisY: { x: -1, y: 0.5 },
      depth: floorDepth + 0.1,
    };
  }
  if (label.mount?.kind === 'wall') {
    const wallId = label.mount.wallId;
    const wall = definition.walls?.find((wall) => wall.id === wallId);
    if (!wall) throw new Error(`Label ${label.id}: unknown wall`);
    return {
      anchor: { x: point.x, y: point.y - label.mount.elevationPx },
      basisX: { x: 1, y: wall.axis === 'u' ? 0.5 : -0.5 },
      basisY: { x: 0, y: 1 },
      depth: point.y + 96,
    };
  }
  return { anchor: point, basisX: { x: 1, y: 0 }, basisY: { x: 0, y: 1 }, depth: 9998 };
}
