import type { IsoProjection, SceneDefinition } from '@lexicon/shared-types';
import type { LogicalRect } from './logicalCollision';
import { projectIso, type LogicalPoint, type ScreenPoint } from './isometricProjection';
import type { Point } from './anchorScreen';
import type { VisualAnchor } from './sceneAssetResolver';

/** Legacy screen points pass through; logical points use the scene's dimetric projector. */
export function projectScenePoint(
  scene: Pick<SceneDefinition, 'projection'>,
  point: LogicalPoint | Point,
): ScreenPoint {
  if ('x' in point) return point;
  return scene.projection ? projectIso(point, scene.projection) : { x: point.u, y: point.v };
}

/** Projects a logical rectangle by its four corners, preserving its complete screen bounds. */
export function projectWorldBounds(
  bounds: LogicalRect,
  projection: IsoProjection,
): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const points = [
    { u: bounds.u, v: bounds.v },
    { u: bounds.u + bounds.width, v: bounds.v },
    { u: bounds.u, v: bounds.v + bounds.height },
    { u: bounds.u + bounds.width, v: bounds.v + bounds.height },
  ].map((point) => projectIso(point, projection));
  const xs = points.map(({ x }) => x);
  const ys = points.map(({ y }) => y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}

/** Projects an anchor and applies its image-only elevation after its floor point is projected. */
export function projectVisualAnchor(
  scene: Pick<SceneDefinition, 'projection'>,
  anchor: VisualAnchor,
): ScreenPoint {
  const point = projectScenePoint(scene, anchor);
  return { x: point.x, y: point.y - anchor.elevationPx };
}
