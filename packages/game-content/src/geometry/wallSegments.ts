import type {
  WallSegmentDefinition,
  SceneAssetDefinition,
  LogicalPoint,
  LogicalRectCollision,
} from '@lexicon/shared-types';
export const WALL_THICKNESS = 0.25;
// Updated from deterministic image export metadata; pivot is the footprint centre.
export const WALL_MODULE_ART = {
  u: { origin: [0.5, 110 / 130] as const, scale: 1 },
  v: { origin: [0.5, 110 / 130] as const, scale: 1 },
};
export function expandWalls(walls: readonly WallSegmentDefinition[]): {
  assets: SceneAssetDefinition[];
  doorways: Array<{ id: string; wallId: string; center: LogicalPoint; rect: LogicalRectCollision }>;
} {
  const assets: SceneAssetDefinition[] = [],
    doorways: Array<{
      id: string;
      wallId: string;
      center: LogicalPoint;
      rect: LogicalRectCollision;
    }> = [];
  for (const wall of walls) {
    const point = (along: number) =>
      wall.axis === 'u'
        ? { u: along, v: wall.line + WALL_THICKNESS / 2 }
        : { u: wall.line + WALL_THICKNESS / 2, v: along };
    const footprint =
      wall.axis === 'u'
        ? { u: -0.5, v: -WALL_THICKNESS / 2, width: 1, height: WALL_THICKNESS }
        : { u: -WALL_THICKNESS / 2, v: -0.5, width: WALL_THICKNESS, height: 1 };
    const open = (i: number) => wall.openings.some((o) => i >= o.start && i < o.end);
    for (let i = wall.start; i < wall.end; i++) {
      if (open(i)) continue;
      const suffix =
        i === wall.start || open(i - 1)
          ? '_cap_start'
          : i === wall.end - 1 || open(i + 1)
            ? '_cap_end'
            : '';
      assets.push({
        id: `${wall.id}:${i}`,
        type: 'wall',
        texture: `tex_wall_${wall.kind}_${wall.axis}${suffix}`,
        position: point(i + 0.5),
        ...WALL_MODULE_ART[wall.axis],
        depthBias: 0,
        wallSpan: wall.end - wall.start,
        footprint,
        collision: { type: 'rect', ...footprint },
      });
    }
    for (const o of wall.openings) {
      const center = point((o.start + o.end) / 2);
      const rect: LogicalRectCollision =
        wall.axis === 'u'
          ? {
              type: 'rect',
              u: o.start,
              v: wall.line,
              width: o.end - o.start,
              height: WALL_THICKNESS,
            }
          : {
              type: 'rect',
              u: wall.line,
              v: o.start,
              width: WALL_THICKNESS,
              height: o.end - o.start,
            };
      doorways.push({ id: o.id, wallId: wall.id, center, rect });
    }
  }
  return { assets, doorways };
}
