import type {
  SceneDefinition,
  SceneAssetDefinition,
  LogicalPoint,
  LogicalRectFootprint,
  WallSegmentDefinition,
} from '@lexicon/shared-types';
import { expandWalls, WALL_THICKNESS } from './wallSegments';
import { validatePortalPlacement } from './portalPlacement';

export const PLAYER_LOGICAL_BODY = { u: -0.18, v: -0.18, width: 0.36, height: 0.36 } as const;
const EPS = 1e-9;
const GRID = 0.125;
export function overlapsLogical(a: LogicalRectFootprint, b: LogicalRectFootprint): boolean {
  return (
    a.u < b.u + b.width - EPS &&
    a.u + a.width > b.u + EPS &&
    a.v < b.v + b.height - EPS &&
    a.v + a.height > b.v + EPS
  );
}

/** Pure content gate. Uses the actual player footprint and interaction radii, never artwork bounds. */
export function validateSceneGeometry(scene: SceneDefinition): string[] {
  if (!scene.walls || !('u' in scene.worldBounds)) return [];
  const bounds = scene.worldBounds,
    errors: string[] = validatePortalPlacement(scene);
  const expanded = expandWalls(scene.walls),
    assets = [...scene.assets, ...expanded.assets];
  const ids = new Set<string>();
  for (const a of assets) {
    if (ids.has(a.id)) errors.push(`duplicate asset id "${a.id}" after wall expansion`);
    ids.add(a.id);
  }
  if (errors.length) return errors;
  const expandedIds = new Set(expanded.assets.map((a) => a.id));
  const wallSources = new Map<string, WallSegmentDefinition>(
    scene.walls.flatMap((wall) =>
      Array.from(
        { length: wall.end - wall.start },
        (_, i) => [`${wall.id}:${wall.start + i}`, wall] as const,
      ),
    ),
  );
  const joinedWalls = (a?: WallSegmentDefinition, b?: WallSegmentDefinition): boolean => {
    if (!a || !b || a.axis === b.axis) return false;
    // A perpendicular wall can meet a corner or end against an existing wall (a T junction).
    // Interior crossings and parallel overlap are not endpoint joins.
    const touchesEndpoint = (wall: WallSegmentDefinition, line: number) =>
      [wall.start, wall.end].some((end) => line <= end + EPS && line + WALL_THICKNESS >= end - EPS);
    return touchesEndpoint(a, b.line) || touchesEndpoint(b, a.line);
  };
  const byId = new Map(assets.map((a) => [a.id, a]));
  const anchors = new Map<string, LogicalPoint>();
  const visiting = new Set<string>();
  const anchor = (a: SceneAssetDefinition): LogicalPoint | null => {
    const known = anchors.get(a.id);
    if (known) return known;
    if (visiting.has(a.id)) return null;
    visiting.add(a.id);
    let p: LogicalPoint | null = a.position ?? null;
    if (a.restsOn && a.surfaceOffset) {
      const parent = byId.get(a.restsOn),
        base = parent ? anchor(parent) : null;
      if (base) p = { u: base.u + a.surfaceOffset.u, v: base.v + a.surfaceOffset.v };
    }
    visiting.delete(a.id);
    if (p) anchors.set(a.id, p);
    else errors.push(`asset "${a.id}": invalid floor anchor`);
    return p;
  };
  const solids = assets.flatMap((a) => {
    const p = anchor(a),
      c = a.collision;
    return p && c && 'u' in c
      ? [
          {
            id: a.id,
            wall: expandedIds.has(a.id) ? wallSources.get(a.id) : undefined,
            u: p.u + c.u,
            v: p.v + c.v,
            width: c.width,
            height: c.height,
          },
        ]
      : [];
  });
  const inside = (r: LogicalRectFootprint) =>
    r.u >= bounds.u - EPS &&
    r.v >= bounds.v - EPS &&
    r.u + r.width <= bounds.u + bounds.width + EPS &&
    r.v + r.height <= bounds.v + bounds.height + EPS;
  for (const [i, s] of solids.entries()) {
    if (!inside(s)) errors.push(`asset "${s.id}": collision outside worldBounds`);
    for (const other of solids.slice(i + 1)) {
      // Only generated perpendicular endpoint joins may share their corner volume.
      if (overlapsLogical(s, other) && !joinedWalls(s.wall, other.wall))
        errors.push(`solid "${s.id}" overlaps "${other.id}"`);
    }
  }
  const declared = new Set(scene.textures.map((t) => t.key));
  for (const texture of new Set(expanded.assets.map((a) => a.texture)))
    if (!declared.has(texture)) errors.push(`wall texture "${texture}" is not declared`);
  for (const door of expanded.doorways) {
    const wall = scene.walls.find((w) => w.id === door.wallId)!;
    const alongU = wall.axis === 'u';
    const start = alongU ? door.rect.u : door.rect.v,
      end = start + (alongU ? door.rect.width : door.rect.height);
    const corridor = alongU
      ? { ...door.rect, v: door.rect.v - 0.6, height: door.rect.height + 1.2 }
      : { ...door.rect, u: door.rect.u - 0.6, width: door.rect.width + 1.2 };
    const intervals = solids
      .filter((s) => overlapsLogical(s, corridor))
      .map(
        (s) =>
          [
            Math.max(start, alongU ? s.u : s.v),
            Math.min(end, alongU ? s.u + s.width : s.v + s.height),
          ] as const,
      )
      .sort((a, b) => a[0] - b[0]);
    let cursor = start,
      free = 0;
    for (const [a, b] of intervals) {
      free = Math.max(free, a - cursor);
      cursor = Math.max(cursor, b);
    }
    free = Math.max(free, end - cursor);
    if (free < 0.96 - EPS)
      errors.push(`doorway "${door.id}": clearance ${free.toFixed(3)} is below 0.96`);
  }
  const fits = (p: LogicalPoint) => {
    const body = {
      u: p.u + PLAYER_LOGICAL_BODY.u,
      v: p.v + PLAYER_LOGICAL_BODY.v,
      width: PLAYER_LOGICAL_BODY.width,
      height: PLAYER_LOGICAL_BODY.height,
    };
    return inside(body) && !solids.some((s) => overlapsLogical(body, s));
  };
  const cols = Math.ceil(bounds.width / GRID),
    rows = Math.ceil(bounds.height / GRID);
  const point = (k: number) => ({
    u: bounds.u + ((k % cols) + 0.5) * GRID,
    v: bounds.v + (Math.floor(k / cols) + 0.5) * GRID,
  });
  const usable = new Uint8Array(cols * rows);
  for (let k = 0; k < usable.length; k++) usable[k] = fits(point(k)) ? 1 : 0;
  const spawn = scene.spawnPoints.default;
  if (!spawn || !('u' in spawn)) return [...errors, 'default logical spawn required'];
  const starts = [...usable.keys()].filter(
    (k) =>
      usable[k] &&
      Math.hypot(point(k).u - spawn.u, point(k).v - spawn.v) <= GRID &&
      fits({ u: (point(k).u + spawn.u) / 2, v: (point(k).v + spawn.v) / 2 }),
  );
  const visited = new Uint8Array(usable.length),
    queue: number[] = [...starts];
  starts.forEach((k) => {
    visited[k] = 1;
  });
  for (let i = 0; i < queue.length; i++) {
    const k = queue[i]!;
    for (const n of [
      k % cols > 0 ? k - 1 : -1,
      k % cols < cols - 1 ? k + 1 : -1,
      k >= cols ? k - cols : -1,
      k + cols < usable.length ? k + cols : -1,
    ])
      if (n >= 0 && usable[n] && !visited[n]) {
        visited[n] = 1;
        queue.push(n);
      }
  }
  const reachable = queue.map(point);
  for (const [id, p] of Object.entries(scene.spawnPoints)) {
    if (!('u' in p) || !fits(p)) errors.push(`spawn "${id}" is blocked or outside bounds`);
    else if (!reachable.some((q) => Math.hypot(q.u - p.u, q.v - p.v) <= GRID))
      errors.push(`spawn "${id}" is unreachable from default spawn`);
  }
  for (const a of scene.assets) {
    const p = anchor(a),
      interaction = a.interaction;
    if (!p || !interaction) continue;
    const target = { u: p.u + interaction.x, v: p.v + interaction.y };
    if (
      !reachable.some((q) => {
        const du = q.u - target.u,
          dv = q.v - target.v;
        return Math.hypot((du - dv) * 64, (du + dv) * 32) <= interaction.radius * 0.8;
      })
    )
      errors.push(`interactable "${a.id}" is unreachable from default spawn`);
  }
  return errors;
}
