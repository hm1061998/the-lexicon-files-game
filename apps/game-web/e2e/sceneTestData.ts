import { readFileSync } from 'node:fs';
type Point = { u: number; v: number };
type Asset = {
  id: string;
  position?: Point;
  restsOn?: string;
  surfaceOffset?: Point;
  interaction?: { x: number; y: number };
};
export function scenePoint(
  sceneId: string,
  id: string,
  offset: Point = { u: 0, v: 0 },
): { x: number; y: number } {
  const scene = JSON.parse(
    readFileSync(
      new URL(
        `../../../packages/game-content/cases/case-001/scenes/${sceneId}.json`,
        import.meta.url,
      ),
      'utf8',
    ),
  ) as { projection: { originX: number; originY: number }; assets: Asset[] };
  const anchor = (asset: Asset): Point => {
    if (asset.position) return asset.position;
    const parent = scene.assets.find((a) => a.id === asset.restsOn);
    if (!parent || !asset.surfaceOffset) throw new Error(`Invalid anchor ${asset.id}`);
    const p = anchor(parent);
    return { u: p.u + asset.surfaceOffset.u, v: p.v + asset.surfaceOffset.v };
  };
  const a = scene.assets.find((a) => a.id === id);
  if (!a) throw new Error(`Unknown test target ${id}`);
  const p = anchor(a),
    u = p.u + (a.interaction?.x ?? 0) + offset.u,
    v = p.v + (a.interaction?.y ?? 0) + offset.v;
  return { x: scene.projection.originX + (u - v) * 64, y: scene.projection.originY + (u + v) * 32 };
}
