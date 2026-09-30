import { mkdirSync, readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { expandWalls } from '../../../packages/game-content/src/geometry/wallSegments';
import type { WallSegmentDefinition } from '../../../packages/shared-types/src/scene';

type Point = { u: number; v: number };
type Rect = Point & { width: number; height: number; id?: string };
type SceneAsset = {
  id: string;
  type: string;
  texture?: string;
  scale?: number;
  angle?: number;
  origin?: [number, number];
  position?: Point;
  restsOn?: string;
  surfaceOffset?: Point & { elevationPx: number };
  collision?: { u: number; v: number; width: number; height: number };
  interaction?: {
    x: number;
    y: number;
    radius: number;
    transition?: { targetSceneId: string; targetSpawnId: string };
  };
};
type SceneJson = {
  id: string;
  textures: Array<{ key: string; url: string }>;
  projection: { originX: number; originY: number; tileWidth: 128; tileHeight: 64 };
  worldBounds: Point & { width: number; height: number };
  spawnPoints: Record<string, Point>;
  assets: SceneAsset[];
  walls?: WallSegmentDefinition[];
  labels?: Array<{ id: string; text: string; u: number; v: number }>;
};
type Area = Point & { id: string; radius: number };

function readScene(file: string): SceneJson {
  return JSON.parse(
    readFileSync(
      new URL(`../../../packages/game-content/cases/case-001/scenes/${file}`, import.meta.url),
      'utf8',
    ),
  ) as SceneJson;
}
function textureSize(scene: SceneJson, key: string): { width: number; height: number } {
  const texture = scene.textures.find((item) => item.key === key);
  if (!texture) throw new Error(`Unknown texture ${key}`);
  const assetPath = texture.url.replace(/^\//, '');
  const bytes = readFileSync(
    new URL(`../../../apps/game-web/public/${assetPath}`, import.meta.url),
  );
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}
const scenes = ['main_office.json', 'archive.json'].map(readScene);
const sceneById = new Map(scenes.map((scene) => [scene.id, scene]));
const expectedAssetIds: Record<string, string[]> = {
  main_office: [
    'floor',
    'wall_back',
    'partition_office_meeting_n',
    'partition_office_meeting_e_n',
    'partition_office_meeting_e_s',
    'partition_office_invest_e',
    'partition_office_hall_w',
    'partition_office_hall_n',
    'partition_office_east_n',
    'player_desk',
    'objective_note',
    'meeting_minutes',
    'phone_recording',
    'anna',
    'hallway_door',
    'leo',
    'david',
    'decor_plant_back_left',
    'decor_cabinet_back_1',
    'decor_cabinet_back_2',
    'decor_plant_tall_invest',
    'decor_file_boxes_invest',
    'decor_coat_rack_invest',
    'decor_desk_west',
    'decor_chair_desk_west',
    'decor_desk_invest',
    'decor_chair_desk_invest',
    'decor_plant_meeting_corner',
    'decor_credenza_meeting',
    'decor_meeting_table',
    'decor_plant_front_left',
    'decor_plant_meeting_wall',
    'decor_cabinet_meeting_1',
    'decor_cabinet_meeting_2',
    'decor_plant_meeting',
    'decor_plant_tall_hall',
    'decor_cabinet_back_3',
    'decor_plant_back_mid',
    'decor_water_cooler',
    'decor_chair_player_desk',
    'decor_file_boxes_hall',
    'decor_coat_rack_hall',
    'decor_plant_back_right',
    'decor_cabinet_east_1',
    'decor_cabinet_east_2',
    'decor_desk_east',
    'decor_chair_desk_east',
    'decor_file_boxes_east',
    'decor_plant_front_right',
    'decor_plant_tall_east',
    'decor_whiteboard_meeting',
    'decor_bulletin_east',
    'west_wall_upper',
    'west_wall_lower',
    'east_outer_wall',
  ],
  archive: [
    'PLACEHOLDER_archive_floor',
    'PLACEHOLDER_archive_wall',
    'partition_archive_hall_n',
    'partition_archive_hall_e',
    'partition_archive_store_n_w',
    'partition_archive_store_n_e',
    'partition_archive_store_e',
    'partition_archive_security_s',
    'PLACEHOLDER_security_terminal',
    'PLACEHOLDER_archive_door',
    'decor_cabinet_wall_1',
    'decor_cabinet_wall_2',
    'decor_plant_corridor',
    'decor_shelf_r1_1',
    'decor_shelf_r1_2',
    'decor_shelf_r1_3',
    'decor_shelf_r1_4',
    'decor_shelf_r1_5',
    'decor_shelf_r1_6',
    'decor_shelf_r1_7',
    'decor_shelf_r1_8',
    'decor_shelf_r2_1',
    'decor_shelf_r2_2',
    'decor_cabinet_left_1',
    'decor_cabinet_left_2',
    'decor_file_boxes_store',
    'decor_shelf_r2_3',
    'decor_shelf_r2_4',
    'decor_cabinet_row_1',
    'decor_cabinet_row_2',
    'decor_chair_terminal',
    'decor_credenza_security',
    'decor_file_boxes_security',
    'decor_cabinet_mid_1',
    'decor_cabinet_mid_2',
    'decor_cabinet_mid_3',
    'decor_desk_security',
    'decor_plant_corner',
    'decor_plant_tall_security',
    'decor_reading_table',
    'decor_cabinet_row_4',
    'decor_cabinet_row_5',
    'decor_file_boxes_reading',
    'decor_plant_reading',
    'decor_bulletin_reading',
    'archive_west_wall_upper',
    'archive_west_wall_lower',
    'archive_east_outer_wall',
  ],
};
const expectedInteractableIds: Record<string, string[]> = {
  main_office: [
    'objective_note',
    'meeting_minutes',
    'phone_recording',
    'anna',
    'hallway_door',
    'leo',
    'david',
  ],
  archive: ['PLACEHOLDER_security_terminal', 'PLACEHOLDER_archive_door'],
};
const body: Rect = { u: -0.18, v: -0.18, width: 0.36, height: 0.36 };
const step = 0.25;

function anchor(scene: SceneJson, asset: SceneAsset, visiting = new Set<string>()): Point {
  if (asset.position) return asset.position;
  if (!asset.restsOn || !asset.surfaceOffset || visiting.has(asset.id))
    throw new Error(`Invalid surface attachment ${asset.id}`);
  visiting.add(asset.id);
  const parent = scene.assets.find((item) => item.id === asset.restsOn);
  if (!parent) throw new Error(`Unknown surface ${asset.restsOn}`);
  const base = anchor(scene, parent, visiting);
  return { u: base.u + asset.surfaceOffset.u, v: base.v + asset.surfaceOffset.v };
}
function rects(scene: SceneJson): Array<Rect & { id: string }> {
  return [...scene.assets, ...expandWalls(scene.walls ?? []).assets].flatMap((asset) =>
    asset.collision
      ? [
          {
            id: asset.id,
            u: anchor(scene, asset).u + asset.collision.u,
            v: anchor(scene, asset).v + asset.collision.v,
            width: asset.collision.width,
            height: asset.collision.height,
          },
        ]
      : [],
  );
}
function areas(scene: SceneJson): Area[] {
  return scene.assets.flatMap((asset) =>
    asset.interaction
      ? [
          {
            id: asset.id,
            u: anchor(scene, asset).u + asset.interaction.x,
            v: anchor(scene, asset).v + asset.interaction.y,
            radius: asset.interaction.radius,
          },
        ]
      : [],
  );
}
function screenDistance(a: Point, b: Point): number {
  const du = a.u - b.u,
    dv = a.v - b.v;
  return Math.hypot((du - dv) * 64, (du + dv) * 32);
}
function overlaps(a: Rect, b: Rect): boolean {
  return a.u < b.u + b.width && a.u + a.width > b.u && a.v < b.v + b.height && a.v + a.height > b.v;
}
function blocked(scene: SceneJson, p: Point): boolean {
  const b = scene.worldBounds;
  const footprint = { u: p.u + body.u, v: p.v + body.v, width: body.width, height: body.height };
  return (
    footprint.u < b.u ||
    footprint.v < b.v ||
    footprint.u + footprint.width > b.u + b.width ||
    footprint.v + footprint.height > b.v + b.height ||
    rects(scene).some((r) => overlaps(footprint, r))
  );
}
function nearest(scene: SceneJson, p: Point): string | null {
  let best: Area | null = null,
    distance = Infinity;
  for (const area of areas(scene)) {
    const d = screenDistance(p, area);
    if (d <= area.radius && d < distance) {
      best = area;
      distance = d;
    }
  }
  return best?.id ?? null;
}
function path(scene: SceneJson, from: Point, target: Area): Point[] | null {
  const b = scene.worldBounds,
    cols = Math.ceil(b.width / step),
    rows = Math.ceil(b.height / step);
  const point = (c: number, r: number): Point => ({
    u: b.u + c * step + step / 2,
    v: b.v + r * step + step / 2,
  });
  const start: [number, number] = [
    Math.max(0, Math.min(cols - 1, Math.floor((from.u - b.u) / step))),
    Math.max(0, Math.min(rows - 1, Math.floor((from.v - b.v) / step))),
  ];
  const key = (c: number, r: number) => r * cols + c;
  const previous = new Map<number, number>([[key(...start), -1]]);
  const queue: Array<[number, number]> = [start];
  for (let i = 0; i < queue.length; i++) {
    const [c, r] = queue[i]!;
    const p = point(c, r);
    if (screenDistance(p, target) <= target.radius * 0.7 && nearest(scene, p) === target.id) {
      const route: Point[] = [];
      for (let k = key(c, r); k !== -1; k = previous.get(k)!)
        route.unshift(point(k % cols, Math.floor(k / cols)));
      return route.filter(
        (p, i) =>
          i === 0 ||
          i === route.length - 1 ||
          Math.sign(p.u - route[i - 1]!.u) !== Math.sign(route[i + 1]!.u - p.u) ||
          Math.sign(p.v - route[i - 1]!.v) !== Math.sign(route[i + 1]!.v - p.v),
      );
    }
    for (const [du, dv] of [
      [step, 0],
      [-step, 0],
      [0, step],
      [0, -step],
    ] as const) {
      const nc = c + Math.round(du / step),
        nr = r + Math.round(dv / step),
        k = key(nc, nr);
      if (nc < 0 || nr < 0 || nc >= cols || nr >= rows || previous.has(k)) continue;
      const next = point(nc, nr);
      if (blocked(scene, next)) continue;
      previous.set(k, key(c, r));
      queue.push([nc, nr]);
    }
  }
  return null;
}

type DebugApi = {
  logicalPlayer(): Point | null;
  nearby(): string | null;
  teleportLogical(u: number, v: number): void;
  labels(): string[];
  requestTransition(sceneId: string, spawnId: string): void;
  storeSceneId(): string;
};
declare global {
  interface Window {
    __lexiconDebug?: DebugApi;
  }
}
async function open(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForFunction(() => window.__lexiconDebug !== undefined);
}
async function drive(page: Page, route: readonly Point[], targetId: string): Promise<void> {
  for (const waypoint of route.slice(1)) {
    let held: string[] = [];
    const deadline = Date.now() + 8000;
    while (Date.now() < deadline) {
      const state = await page.evaluate(() => ({
        point: window.__lexiconDebug!.logicalPlayer()!,
        nearby: window.__lexiconDebug!.nearby(),
      }));
      if (state.nearby === targetId) {
        for (const key of held) await page.keyboard.up(key);
        return;
      }
      const du = waypoint.u - state.point.u,
        dv = waypoint.v - state.point.v;
      if (Math.abs(du) < 0.12 && Math.abs(dv) < 0.12) break;
      const screenX = (du - dv) * 64;
      const screenY = (du + dv) * 32;
      const max = Math.max(Math.abs(screenX), Math.abs(screenY));
      const next =
        max === 0
          ? []
          : [
              ...(Math.abs(screenX) / max >= 0.5 ? [screenX < 0 ? 'a' : 'd'] : []),
              ...(Math.abs(screenY) / max >= 0.5 ? [screenY < 0 ? 'w' : 's'] : []),
            ];
      for (const key of held.filter((key) => !next.includes(key))) await page.keyboard.up(key);
      for (const key of next.filter((key) => !held.includes(key))) await page.keyboard.down(key);
      held = next;
      await page.waitForTimeout(30);
    }
    for (const key of held) await page.keyboard.up(key);
  }
  try {
    await expect
      .poll(() => page.evaluate(() => window.__lexiconDebug!.nearby()), { timeout: 3000 })
      .toBe(targetId);
  } catch (error) {
    const finalState = await page.evaluate(() => ({
      point: window.__lexiconDebug!.logicalPlayer(),
      nearby: window.__lexiconDebug!.nearby(),
    }));
    throw new Error(
      `${error instanceof Error ? error.message : String(error)}; final state ${JSON.stringify(finalState)}; route ${JSON.stringify(route)}`,
    );
  }
}

for (const scene of scenes) {
  test(`${scene.id}: public scene and interactable IDs are preserved`, () => {
    expect([...scene.assets, ...(scene.walls ?? [])].map(({ id }) => id).sort()).toEqual(
      expectedAssetIds[scene.id]!.sort(),
    );
    expect(
      scene.assets
        .filter(({ interaction }) => interaction)
        .map(({ id }) => id)
        .sort(),
    ).toEqual(expectedInteractableIds[scene.id]!.sort());
  });

  test(`${scene.id}: floor diamond corners match projected worldBounds`, () => {
    const floor = scene.assets.find((a) => a.type === 'background')!;
    expect(floor.texture).toBe(`tex_floor_${scene.id === 'main_office' ? 'office' : 'archive'}`);
    const { width, height } = textureSize(scene, floor.texture!);
    expect(width).toBe((scene.worldBounds.width + scene.worldBounds.height) * 64);
    expect(height).toBe((scene.worldBounds.width + scene.worldBounds.height) * 32);
    expect(floor.position).toEqual({ u: 0, v: 0 });
    expect(floor.origin).toEqual([
      scene.worldBounds.height / (scene.worldBounds.width + scene.worldBounds.height),
      0,
    ]);
  });
  test(`${scene.id}: door opening has no collider`, () => {
    const door = areas(scene).find((a) => a.id.includes('door'))!;
    expect(blocked(scene, door)).toBe(false);
    expect(scene.walls?.some((w) => w.openings.length > 0)).toBe(true);
  });

  test(`${scene.id}: assets, spawns, bounds and labels use logical dimetric coordinates`, () => {
    expect(scene.projection).toMatchObject({ tileWidth: 128, tileHeight: 64 });
    expect(scene.worldBounds.width).toBeGreaterThan(0);
    expect(scene.worldBounds.height).toBeGreaterThan(0);
    for (const asset of scene.assets)
      expect(
        asset.position || (asset.restsOn && asset.surfaceOffset),
        `${asset.id} has logical placement`,
      ).toBeTruthy();
    for (const point of Object.values(scene.spawnPoints))
      expect(blocked(scene, point), 'spawn footprint is free').toBe(false);
    const labels = scene.labels ?? [];
    expect(labels.length).toBeGreaterThan(0);
    expect(new Set(labels.map((label) => label.id)).size).toBe(labels.length);
    for (const label of labels)
      expect(
        label.u >= scene.worldBounds.u &&
          label.u <= scene.worldBounds.u + scene.worldBounds.width &&
          label.v >= scene.worldBounds.v &&
          label.v <= scene.worldBounds.v + scene.worldBounds.height,
      ).toBe(true);
  });

  test(`${scene.id}: tabletop evidence stays attached to its surface`, () => {
    if (scene.id === 'main_office') {
      for (const id of ['objective_note', 'meeting_minutes', 'phone_recording']) {
        const asset = scene.assets.find((item) => item.id === id)!;
        expect(asset.restsOn, id).toBeTruthy();
        expect(asset.surfaceOffset, id).toBeTruthy();
      }
    }
  });

  test(`${scene.id}: every interactable is reachable from each spawn`, () => {
    for (const [spawnId, start] of Object.entries(scene.spawnPoints))
      for (const target of areas(scene)) {
        expect(path(scene, start, target), `${spawnId} -> ${target.id}`).not.toBeNull();
      }
  });

  test(`${scene.id}: room labels come from scene content`, async ({ page }) => {
    await open(page);
    if (scene.id === 'archive')
      await page.evaluate(() => window.__lexiconDebug!.requestTransition('archive', 'from_office'));
    await expect
      .poll(() => page.evaluate(() => window.__lexiconDebug!.labels()))
      .toEqual((scene.labels ?? []).map(({ text }) => text));
  });

  test(`${scene.id}: a primary interactable is reachable on foot from its arrival spawn`, async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await open(page);
    const spawnId = scene.id === 'archive' ? 'from_office' : 'default';
    if (scene.id === 'archive') {
      const before = await page.evaluateHandle(() => window.__lexiconDebug);
      await page.evaluate(() => window.__lexiconDebug!.requestTransition('archive', 'from_office'));
      await page.waitForFunction((old) => window.__lexiconDebug !== old, before);
    }
    const targetId =
      scene.id === 'main_office' ? 'objective_note' : 'PLACEHOLDER_security_terminal';
    const target = areas(scene).find(({ id }) => id === targetId)!;
    const start = await page.evaluate(() => window.__lexiconDebug!.logicalPlayer()!);
    const route = path(scene, start, target);
    expect(route, `${spawnId} -> ${target.id}`).not.toBeNull();
    await drive(page, route!, target.id);
  });
}

test('office/archive doorway transitions are two-way and the doorway footprint stays clear', async ({
  page,
}) => {
  const office = sceneById.get('main_office')!,
    archive = sceneById.get('archive')!;
  for (const [scene, doorId] of [
    [office, 'hallway_door'],
    [archive, 'PLACEHOLDER_archive_door'],
  ] as const) {
    const door = scene.assets.find((asset) => asset.id === doorId)!;
    const p = {
      u: anchor(scene, door).u + door.interaction!.x,
      v: anchor(scene, door).v + door.interaction!.y,
    };
    expect(blocked(scene, p), `${scene.id} doorway`).toBe(false);
    expect(door.interaction!.transition).toBeDefined();
    const target = sceneById.get(door.interaction!.transition!.targetSceneId)!;
    expect(target.spawnPoints[door.interaction!.transition!.targetSpawnId]).toBeDefined();
  }
  await open(page);
  await page.evaluate(() => window.__lexiconDebug!.requestTransition('archive', 'from_office'));
  await expect
    .poll(() => page.evaluate(() => window.__lexiconDebug!.storeSceneId()))
    .toBe('archive');
  await page.evaluate(() =>
    window.__lexiconDebug!.requestTransition('main_office', 'from_archive'),
  );
  await expect
    .poll(() => page.evaluate(() => window.__lexiconDebug!.storeSceneId()))
    .toBe('main_office');
});

// Bỏ fixme ở Task 6/7 khi model và layout mới được migrate.
test('the player can walk to the office exit and transition by interacting', async ({ page }) => {
  const office = sceneById.get('main_office')!;
  const door = areas(office).find(({ id }) => id === 'hallway_door')!;
  await open(page);
  const start = await page.evaluate(() => window.__lexiconDebug!.logicalPlayer()!);
  const route = path(office, start, door);
  expect(route, 'default spawn -> hallway_door').not.toBeNull();
  await drive(page, route!, 'hallway_door');
  await page.keyboard.press('e');
  await expect
    .poll(() => page.evaluate(() => window.__lexiconDebug!.storeSceneId()), { timeout: 10_000 })
    .toBe('archive');
});

test('the player can walk from the archive arrival spawn to the archive exit and transition back', async ({
  page,
}) => {
  await open(page);
  const office = sceneById.get('main_office')!;
  const exit = areas(office).find(({ id }) => id === 'hallway_door')!;
  const start = await page.evaluate(() => window.__lexiconDebug!.logicalPlayer()!);
  await drive(page, path(office, start, exit)!, exit.id);
  const officeDebug = await page.evaluateHandle(() => window.__lexiconDebug);
  await page.keyboard.press('e');
  await expect
    .poll(() => page.evaluate(() => window.__lexiconDebug!.storeSceneId()))
    .toBe('archive');
  await page.waitForFunction((old) => window.__lexiconDebug !== old, officeDebug);
  const archive = sceneById.get('archive')!;
  const door = areas(archive).find(({ id }) => id === 'PLACEHOLDER_archive_door')!;
  const arrival = await page.evaluate(() => window.__lexiconDebug!.logicalPlayer()!);
  const route = path(archive, arrival, door);
  expect(route).not.toBeNull();
  await drive(page, route!, door.id);
  await page.keyboard.press('e');
  await expect
    .poll(() => page.evaluate(() => window.__lexiconDebug!.storeSceneId()))
    .toBe('main_office');
});

test('scene review captures office and archive at desktop viewport', async ({ page }) => {
  const output = '../../.superpowers/sdd/2026-09-30-phase-11e-office-archive-static-world-redesign';
  mkdirSync(output, { recursive: true });
  await page.setViewportSize({ width: 1280, height: 720 });
  await open(page);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${output}/office-1280x720.png` });
  const previous = await page.evaluateHandle(() => window.__lexiconDebug);
  await page.evaluate(() => window.__lexiconDebug!.requestTransition('archive', 'from_office'));
  await page.waitForFunction((old) => window.__lexiconDebug !== old, previous);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${output}/archive-1280x720.png` });
});
