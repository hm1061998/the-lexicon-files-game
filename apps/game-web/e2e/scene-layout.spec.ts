import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

/** Scene layout read from content at test time: no Case ids or coordinates hardcoded here. */
type Rect = { x: number; y: number; width: number; height: number };
type Asset = {
  id: string;
  type: string;
  x: number;
  y: number;
  collision?: Rect;
  interaction?: { x: number; y: number; radius: number };
};
type SceneJson = {
  id: string;
  worldBounds: Rect;
  spawnPoints: Record<string, { x: number; y: number }>;
  assets: Asset[];
};
type Area = { id: string; x: number; y: number; radius: number };
type Point = { x: number; y: number };

function readScene(file: string): SceneJson {
  const url = new URL(
    `../../../packages/game-content/cases/case-001/scenes/${file}`,
    import.meta.url,
  );
  return JSON.parse(readFileSync(url, 'utf8')) as SceneJson;
}

// Player footprint: 30x18 box whose bottom edge is the feet (constants PLAYER_BODY).
const BODY_W = 30;
const BODY_H = 18;
// Generous margin: the steering below may overshoot a waypoint by a few frames of movement.
const CLEARANCE = 24;
const GRID = 10;

function worldRects(scene: SceneJson): Array<Rect & { id: string }> {
  return scene.assets
    .filter((a) => a.collision)
    .map((a) => ({
      id: a.id,
      x: a.x + a.collision!.x,
      y: a.y + a.collision!.y,
      width: a.collision!.width,
      height: a.collision!.height,
    }));
}

function areas(scene: SceneJson): Area[] {
  return scene.assets
    .filter((a) => a.interaction)
    .map((a) => ({
      id: a.id,
      x: a.x + a.interaction!.x,
      y: a.y + a.interaction!.y,
      radius: a.interaction!.radius,
    }));
}

function nearest(p: Point, all: readonly Area[]): string | null {
  let best: Area | null = null;
  let bestD = Infinity;
  for (const a of all) {
    const d = Math.hypot(p.x - a.x, p.y - a.y);
    if (d <= a.radius && d < bestD) {
      best = a;
      bestD = d;
    }
  }
  return best?.id ?? null;
}

function blockedAt(
  scene: SceneJson,
  rects: readonly Rect[],
  p: Point,
  clearance = CLEARANCE,
): boolean {
  const b = scene.worldBounds;
  const x0 = p.x - BODY_W / 2 - clearance;
  const x1 = p.x + BODY_W / 2 + clearance;
  const y0 = p.y - BODY_H - clearance;
  const y1 = p.y + clearance;
  if (x0 < b.x || x1 > b.x + b.width || y0 < b.y || y1 > b.y + b.height) return true;
  return rects.some((r) => x1 > r.x && x0 < r.x + r.width && y1 > r.y && y0 < r.y + r.height);
}

/** Grid BFS over the collision footprints; returns waypoints or null when unreachable. */
function findPath(scene: SceneJson, from: Point, target: Area): Point[] | null {
  const rects = worldRects(scene);
  const all = areas(scene);
  const b = scene.worldBounds;
  const cols = Math.floor(b.width / GRID);
  const rows = Math.floor(b.height / GRID);
  const cell = (c: number, r: number): Point => ({
    x: b.x + c * GRID + GRID / 2,
    y: b.y + r * GRID + GRID / 2,
  });
  const start = [Math.floor((from.x - b.x) / GRID), Math.floor((from.y - b.y) / GRID)] as const;
  const key = (c: number, r: number) => r * cols + c;
  const prev = new Map<number, number>([[key(start[0], start[1]), -1]]);
  const queue: Array<readonly [number, number]> = [start];
  const isGoal = (p: Point) =>
    Math.hypot(p.x - target.x, p.y - target.y) <= target.radius * 0.6 &&
    nearest(p, all) === target.id;
  for (let i = 0; i < queue.length; i++) {
    const [c, r] = queue[i]!;
    const p = cell(c, r);
    if (isGoal(p)) {
      const path: Point[] = [];
      for (let k = key(c, r); k !== -1; k = prev.get(k)!)
        path.unshift(cell(k % cols, Math.floor(k / cols)));
      // keep only turning points
      return path.filter((pt, idx) => {
        if (idx === 0 || idx === path.length - 1) return true;
        const a = path[idx - 1]!;
        const n = path[idx + 1]!;
        return (
          Math.sign(pt.x - a.x) !== Math.sign(n.x - pt.x) ||
          Math.sign(pt.y - a.y) !== Math.sign(n.y - pt.y)
        );
      });
    }
    for (const [dc, dr] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const nc = c + dc;
      const nr = r + dr;
      if (nc < 0 || nr < 0 || nc >= cols || nr >= rows || prev.has(key(nc, nr))) continue;
      // Leaving a cell inside the clearance margin (e.g. right after talking to an NPC) is fine
      // as long as the footprint itself is free.
      const next = cell(nc, nr);
      const inMargin = blockedAt(scene, rects, p);
      if (blockedAt(scene, rects, next, inMargin ? 0 : CLEARANCE)) continue;
      prev.set(key(nc, nr), key(c, r));
      queue.push([nc, nr]);
    }
  }
  return null;
}

type DebugApi = {
  player(): { x: number; y: number };
  nearby(): string | null;
  teleport(x: number, y: number): void;
  requestTransition(sceneId: string, spawnId: string): void;
};
declare global {
  interface Window {
    __lexiconDebug?: DebugApi;
  }
}

const playerPos = (page: Page) => page.evaluate(() => window.__lexiconDebug!.player());

const ARRIVE = 24;

const state = (page: Page) =>
  page.evaluate(() => ({
    ...window.__lexiconDebug!.player(),
    nearby: window.__lexiconDebug!.nearby(),
  }));

/**
 * Steers with WASD along the axis-aligned BFS legs: holds a key while far and taps it when
 * close. Frames can be coarse on a software renderer, so the tap length adapts: halved after an
 * overshoot, doubled after a tap that did not move the player. The walk ends as soon as the
 * target is nearby. Fails when the distance to the next waypoint stops shrinking for 2 s
 * (blocked by art); no fixed per-leg deadline because slow renderers walk slower.
 */
async function walk(page: Page, waypoints: readonly Point[], targetId: string): Promise<void> {
  for (const wp of waypoints.slice(1)) {
    let best = Infinity;
    let lastProgress = Date.now();
    const legStart = Date.now();
    let held: string | null = null;
    let tapMs = 80;
    let lastTap: { key: string; d: number; at: Point } | null = null;
    for (;;) {
      const p = await state(page);
      if (p.nearby === targetId) {
        if (held) await page.keyboard.up(held);
        return;
      }
      const dx = wp.x - p.x;
      const dy = wp.y - p.y;
      if (Math.abs(dx) <= ARRIVE && Math.abs(dy) <= ARRIVE) break;
      const dist = Math.hypot(dx, dy);
      if (dist < best - 2) {
        best = dist;
        lastProgress = Date.now();
      }
      if (Date.now() - lastProgress > 3000 || Date.now() - legStart > 30000) {
        if (held) await page.keyboard.up(held);
        throw new Error(
          `${targetId}: stuck at ${Math.round(p.x)},${Math.round(p.y)} heading to ${wp.x},${wp.y} (nearby ${p.nearby})`,
        );
      }
      const alongX = Math.abs(dx) >= Math.abs(dy);
      const d = alongX ? dx : dy;
      const key = alongX ? (d > 0 ? 'd' : 'a') : d > 0 ? 's' : 'w';
      if (held && held !== key) {
        await page.keyboard.up(held);
        held = null;
      }
      if (Math.abs(d) > 60) {
        if (!held) await page.keyboard.down(key);
        held = key;
        lastTap = null;
        await page.waitForTimeout(10);
        continue;
      }
      if (held) await page.keyboard.up(held);
      held = null;
      if (lastTap) {
        const moved = Math.hypot(p.x - lastTap.at.x, p.y - lastTap.at.y) > 0.5;
        if (!moved) tapMs = Math.min(160, tapMs * 2);
        else if (Math.sign(d) !== Math.sign(lastTap.d)) tapMs = Math.max(5, tapMs / 2);
      }
      lastTap = { key, d, at: { x: p.x, y: p.y } };
      await page.keyboard.down(key);
      await page.waitForTimeout(tapMs);
      await page.keyboard.up(key);
      // let at least one frame apply the tap before measuring
      await page.waitForTimeout(30);
    }
    if (held) await page.keyboard.up(held);
  }
}

async function open(page: Page, scene: SceneJson, spawnId: string): Promise<void> {
  await page.goto('/');
  await page.waitForFunction(() => window.__lexiconDebug !== undefined);
  if (spawnId === 'default') return;
  const before = await page.evaluateHandle(() => window.__lexiconDebug);
  await page.evaluate(
    ([s, p]) => window.__lexiconDebug!.requestTransition(s!, p!),
    [scene.id, spawnId],
  );
  await page.waitForFunction(
    (previous) => window.__lexiconDebug !== undefined && window.__lexiconDebug !== previous,
    before,
  );
}

// The spawn each scene is entered from during play.
const CASES = [
  { file: 'main_office.json', spawn: 'default' },
  { file: 'archive.json', spawn: 'from_office' },
];

for (const { file, spawn } of CASES) {
  const scene = readScene(file);

  test(`${scene.id}: decor footprints stay clear of interaction points and spawns`, () => {
    const decor = worldRects(scene).filter((r) => r.id.startsWith('decor_'));
    for (const r of decor) {
      for (const a of areas(scene)) {
        const inside = a.x >= r.x && a.x <= r.x + r.width && a.y >= r.y && a.y <= r.y + r.height;
        expect(inside, `${r.id} covers ${a.id}`).toBe(false);
      }
      for (const [id, p] of Object.entries(scene.spawnPoints)) {
        expect(blockedAt(scene, [r], p), `${r.id} blocks spawn ${id}`).toBe(false);
      }
    }
  });

  test(`${scene.id}: every interactable is reachable on foot from spawn "${spawn}"`, async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await open(page, scene, spawn);
    for (const target of areas(scene)) {
      const from = await playerPos(page);
      const path = findPath(scene, from, target);
      expect(path, `no walkable path to ${target.id}`).not.toBeNull();
      await walk(page, path!, target.id);
      await expect
        .poll(() => page.evaluate(() => window.__lexiconDebug!.nearby()), { timeout: 2000 })
        .toBe(target.id);
    }
  });

  test(`${scene.id}: player cannot walk through decor props`, async ({ page }) => {
    const rects = worldRects(scene);
    const decor = rects.filter((r) => r.id.startsWith('decor_'));
    expect(decor.length).toBeGreaterThan(0);
    await open(page, scene, spawn);
    for (const r of decor) {
      const cx = r.x + r.width / 2;
      // Approach from below (walking up) or from above (walking down), whichever side is free.
      const below = { x: cx, y: r.y + r.height + BODY_H + 24 };
      const above = { x: cx, y: r.y - 24 };
      const fromBelow = !blockedAt(scene, rects, below);
      const start = fromBelow ? below : above;
      expect(blockedAt(scene, rects, start), `${r.id}: no free side to test from`).toBe(false);
      await page.evaluate(([x, y]) => window.__lexiconDebug!.teleport(x!, y!), [start.x, start.y]);
      const key = fromBelow ? 'w' : 's';
      await page.keyboard.down(key);
      await page.waitForTimeout(700);
      await page.keyboard.up(key);
      const p = await playerPos(page);
      if (fromBelow) expect(p.y - BODY_H, r.id).toBeGreaterThanOrEqual(r.y + r.height - 2);
      else expect(p.y, r.id).toBeLessThanOrEqual(r.y + 2);
    }
  });
}
