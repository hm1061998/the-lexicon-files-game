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
type Label = { id: string; text: string; x: number; y: number };
type SceneJson = {
  id: string;
  worldBounds: Rect;
  spawnPoints: Record<string, { x: number; y: number }>;
  assets: Asset[];
  labels?: Label[];
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
// Every interaction point (evidence, NPC, door) keeps this much free floor to any other collision.
const MIN_INTERACTION_CLEARANCE = 48;
// Blocking scene furniture: decor props and inner room walls.
const BLOCKING = /^(?:decor|partition)_/;

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

function distanceToRect(p: Point, r: Rect): number {
  const dx = Math.max(r.x - p.x, 0, p.x - (r.x + r.width));
  const dy = Math.max(r.y - p.y, 0, p.y - (r.y + r.height));
  return Math.hypot(dx, dy);
}

type DebugApi = {
  labels(): string[];
  alphaOf(id: string): number;
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
    const decor = worldRects(scene).filter((r) => BLOCKING.test(r.id));
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

  test(`${scene.id}: every interaction point keeps ${MIN_INTERACTION_CLEARANCE} px to other collisions`, () => {
    const rects = worldRects(scene);
    for (const a of areas(scene)) {
      for (const r of rects) {
        if (r.id === a.id) continue; // an object's own footprint (terminal, NPC body)
        expect(
          distanceToRect(a, r),
          `${a.id} is ${Math.round(distanceToRect(a, r))} px from ${r.id}`,
        ).toBeGreaterThanOrEqual(MIN_INTERACTION_CLEARANCE);
      }
    }
  });

  test(`${scene.id}: every interaction point is reachable from every spawn`, () => {
    for (const [id, p] of Object.entries(scene.spawnPoints)) {
      for (const target of areas(scene)) {
        expect(findPath(scene, p, target), `spawn ${id} -> ${target.id}`).not.toBeNull();
      }
    }
  });

  test(`${scene.id}: room labels have unique ids and text inside the world`, () => {
    const labels = scene.labels ?? [];
    expect(labels.length).toBeGreaterThan(0);
    expect(new Set(labels.map(({ id }) => id)).size).toBe(labels.length);
    const b = scene.worldBounds;
    for (const l of labels) {
      expect(l.text.trim().length, l.id).toBeGreaterThan(0);
      expect(l.x >= b.x && l.x <= b.x + b.width && l.y >= b.y && l.y <= b.y + b.height, l.id).toBe(
        true,
      );
    }
  });

  test(`${scene.id}: room labels from content are drawn in the scene`, async ({ page }) => {
    await open(page, scene, spawn);
    await expect
      .poll(() => page.evaluate(() => window.__lexiconDebug!.labels()))
      .toEqual((scene.labels ?? []).map(({ text }) => text));
  });

  test(`${scene.id}: room walls fade while the player stands behind them`, async ({ page }) => {
    const rects = worldRects(scene);
    const walls = rects.filter((r) => r.id.startsWith('partition_') && r.width > r.height);
    expect(walls.length).toBeGreaterThan(0);
    await open(page, scene, spawn);
    const alpha = (id: string) => page.evaluate((i) => window.__lexiconDebug!.alphaOf(i), id);
    const teleport = (p: Point) =>
      page.evaluate(([x, y]) => window.__lexiconDebug!.teleport(x!, y!), [p.x, p.y]);
    for (const r of walls) {
      // Probe along the wall for a free spot just behind it and one just in front of it.
      const xs = Array.from({ length: 9 }, (_, k) => r.x + ((k + 1) * r.width) / 10);
      const behind = xs
        .map((x) => ({ x, y: r.y - 30 }))
        .find((p) => !blockedAt(scene, rects, p, 0));
      const front = xs
        .map((x) => ({ x, y: r.y + r.height + BODY_H + 20 }))
        .find((p) => !blockedAt(scene, rects, p, 0));
      expect(behind && front, `${r.id}: no free spot on both sides`).toBeTruthy();
      await teleport(behind!);
      await expect.poll(() => alpha(r.id), { message: `${r.id} behind` }).toBeLessThan(1);
      await teleport(front!);
      await expect.poll(() => alpha(r.id), { message: `${r.id} in front` }).toBe(1);
    }
  });

  test(`${scene.id}: every interactable is reachable on foot from spawn "${spawn}"`, async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await open(page, scene, spawn);
    const nearbyNow = () => page.evaluate(() => window.__lexiconDebug!.nearby());
    for (const target of areas(scene)) {
      // A leg that only grazes the interaction circle can coast out of it after the key is
      // released on a slow frame; re-plan from where the player stopped (at most twice more).
      for (let attempt = 0; attempt < 3; attempt++) {
        const from = await playerPos(page);
        const path = findPath(scene, from, target);
        expect(path, `no walkable path to ${target.id}`).not.toBeNull();
        await walk(page, path!, target.id);
        await page.waitForTimeout(300);
        if ((await nearbyNow()) === target.id) break;
      }
      await expect.poll(nearbyNow, { timeout: 2000 }).toBe(target.id);
    }
  });

  test(`${scene.id}: player cannot walk through decor props or room walls`, async ({ page }) => {
    test.setTimeout(120_000);
    const rects = worldRects(scene);
    const blocking = rects.filter((r) => BLOCKING.test(r.id));
    expect(blocking.some((r) => r.id.startsWith('decor_'))).toBe(true);
    expect(blocking.some((r) => r.id.startsWith('partition_'))).toBe(true);
    await open(page, scene, spawn);
    for (const r of blocking) {
      const cx = r.x + r.width / 2;
      const cy = r.y + r.height / 2;
      // Approach from whichever side is free: walk up from below, down from above, or sideways.
      const sides = [
        { start: { x: cx, y: r.y + r.height + BODY_H + 24 }, key: 'w' },
        { start: { x: cx, y: r.y - 24 }, key: 's' },
        { start: { x: r.x - BODY_W / 2 - 24, y: cy + BODY_H / 2 }, key: 'd' },
        { start: { x: r.x + r.width + BODY_W / 2 + 24, y: cy + BODY_H / 2 }, key: 'a' },
      ] as const;
      const side = sides.find(({ start }) => !blockedAt(scene, rects, start));
      expect(side, `${r.id}: no free side to test from`).toBeDefined();
      const { start, key } = side!;
      await page.evaluate(([x, y]) => window.__lexiconDebug!.teleport(x!, y!), [start.x, start.y]);
      await page.keyboard.down(key);
      await page.waitForTimeout(700);
      await page.keyboard.up(key);
      const p = await playerPos(page);
      if (key === 'w') expect(p.y - BODY_H, r.id).toBeGreaterThanOrEqual(r.y + r.height - 2);
      else if (key === 's') expect(p.y, r.id).toBeLessThanOrEqual(r.y + 2);
      else if (key === 'd') expect(p.x + BODY_W / 2, r.id).toBeLessThanOrEqual(r.x + 2);
      else expect(p.x - BODY_W / 2, r.id).toBeGreaterThanOrEqual(r.x + r.width - 2);
    }
  });
}
