import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

type SceneTextures = { textures: Array<{ key: string; url: string }> };

function sceneTextures(file: string): Array<{ key: string; url: string }> {
  const url = new URL(
    `../../../packages/game-content/cases/case-001/scenes/${file}`,
    import.meta.url,
  );
  return (JSON.parse(readFileSync(url, 'utf8')) as SceneTextures).textures;
}

const officeTextures = sceneTextures('main_office.json');
const archiveTextures = sceneTextures('archive.json');
/** Textures only the archive declares: they must load on entering the archive, not at boot. */
const archiveOnlyTextures = archiveTextures.filter(
  ({ key }) => !officeTextures.some((office) => office.key === key),
);

type DebugApi = {
  player(): { x: number; y: number; depth: number };
  playerTexture(): string;
  playerAnim(): { key: string | null; frame: number | null; playing: boolean };
  depthOf(id: string): number;
  nearby(): string | null;
  nearbyEvents(): number;
  teleport(x: number, y: number): void;
  markerY(): number | null;
  markerBaseY(): number | null;
  paperOverlayAlpha(): number | null;
  requestTransition(sceneId: string, spawnId: string): void;
  storeSceneId(): string;
  triggeredEvents(): number;
};

declare global {
  interface Window {
    __lexiconDebug?: DebugApi;
  }
}

async function openWorld(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForFunction(() => window.__lexiconDebug !== undefined);
  // Key handlers attach with the HUD; wait for it before pressing keys.
  await expect(page.locator('.hud-key-hints')).toBeVisible();
}

async function player(page: Page): Promise<{ x: number; y: number; depth: number }> {
  return page.evaluate(() => window.__lexiconDebug!.player());
}

async function hold(page: Page, key: string, ms: number): Promise<void> {
  await page.keyboard.down(key);
  await page.waitForTimeout(ms);
  await page.keyboard.up(key);
}

/** Walk right until the note is in range; fixed hold times are too fragile on slow renderers. */
async function walkToNote(page: Page): Promise<void> {
  await page.keyboard.down('d');
  await expect
    .poll(() => page.evaluate(() => window.__lexiconDebug!.nearby()))
    .toBe('objective_note');
  await page.keyboard.up('d');
}

test('player moves right while D is held', async ({ page }) => {
  await openWorld(page);
  const before = await player(page);
  await hold(page, 'd', 1000);
  const after = await player(page);
  expect(after.x - before.x).toBeGreaterThanOrEqual(80);
});

test('player cannot walk through the desk', async ({ page }) => {
  await openWorld(page);
  await hold(page, 'w', 3000);
  const after = await player(page);
  expect(after.y).toBeGreaterThan(820);
  expect(after.y).toBeLessThan(1100);
});

test('player cannot leave the world', async ({ page }) => {
  await openWorld(page);
  await hold(page, 'a', 7000);
  const after = await player(page);
  expect(after.x).toBeGreaterThanOrEqual(0);
});

test('player in front of desk draws above it', async ({ page }) => {
  await openWorld(page);
  const depths = await page.evaluate(() => ({
    player: window.__lexiconDebug!.player().depth,
    desk: window.__lexiconDebug!.depthOf('player_desk'),
  }));
  expect(depths.player).toBeGreaterThan(depths.desk);
});

test('player behind desk draws below it', async ({ page }) => {
  await openWorld(page);
  await page.evaluate(() => window.__lexiconDebug!.teleport(1200, 700));
  const depths = await page.evaluate(() => ({
    player: window.__lexiconDebug!.player().depth,
    desk: window.__lexiconDebug!.depthOf('player_desk'),
  }));
  expect(depths.player).toBeLessThan(depths.desk);
});

test('entering the note radius reports it nearby', async ({ page }) => {
  await openWorld(page);
  await page.evaluate(() => window.__lexiconDebug!.teleport(1400, 1100));
  const nearWhileIn = await page.evaluate(() => window.__lexiconDebug!.nearby());
  expect(nearWhileIn).toBe('objective_note');
  await page.evaluate(() => window.__lexiconDebug!.teleport(1800, 1100));
  await expect.poll(() => page.evaluate(() => window.__lexiconDebug!.nearby())).toBeNull();
});

test('nearby event fires once per entry', async ({ page }) => {
  await openWorld(page);
  await walkToNote(page);
  const count = await page.evaluate(() => window.__lexiconDebug!.nearbyEvents());
  expect(count).toBe(1);
});

test('typing WASD into a page input does not move the player or get swallowed', async ({
  page,
}) => {
  await openWorld(page);
  await page.evaluate(() => {
    const input = document.createElement('input');
    input.id = 'lexicon-test-input';
    document.body.appendChild(input);
  });
  const before = await player(page);
  await page.focus('#lexicon-test-input');
  await page.keyboard.type('wa');
  const value = await page.locator('#lexicon-test-input').inputValue();
  expect(value).toBe('wa');
  const after = await player(page);
  expect(after.x).toBeCloseTo(before.x, 0);
  expect(after.y).toBeCloseTo(before.y, 0);
});

test('single canvas and no console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  await openWorld(page);
  await expect(page.locator('canvas')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('interaction marker floats, holds still under reduced motion, and floats again', async ({
  page,
}) => {
  await openWorld(page);
  await page.evaluate(() => window.__lexiconDebug!.teleport(1400, 1100));
  const markerY = () => page.evaluate(() => window.__lexiconDebug!.markerY());
  await expect.poll(markerY).not.toBeNull();

  const a = await markerY();
  await page.waitForTimeout(500);
  const b = await markerY();
  expect(a).not.toBe(b);

  await page.keyboard.press('Escape');
  const pause = page.getByRole('dialog');
  await expect(pause).toBeVisible();
  await pause.getByLabel('Giảm chuyển động').check();
  await page.waitForTimeout(200);
  const c = await markerY();
  await page.waitForTimeout(500);
  const d = await markerY();
  expect(c).toBe(d);
  // Held still means resting exactly on the anchor, not frozen mid-float.
  expect(c).toBe(await page.evaluate(() => window.__lexiconDebug!.markerBaseY()));

  await pause.getByLabel('Giảm chuyển động').uncheck();
  await page.waitForTimeout(200);
  const e = await markerY();
  await page.waitForTimeout(500);
  const f = await markerY();
  expect(e).not.toBe(f);
});

test('marker anchor follows the current interactable, not the previous one', async ({ page }) => {
  await openWorld(page);
  const anchor = () => page.evaluate(() => window.__lexiconDebug!.markerBaseY());
  await page.evaluate(() => window.__lexiconDebug!.teleport(1400, 1100));
  await expect
    .poll(() => page.evaluate(() => window.__lexiconDebug!.nearby()))
    .toBe('objective_note');
  const note = await anchor();
  await page.evaluate(() => window.__lexiconDebug!.teleport(2100, 700));
  await expect
    .poll(() => page.evaluate(() => window.__lexiconDebug!.nearby()))
    .not.toBe('objective_note');
  await expect.poll(() => page.evaluate(() => window.__lexiconDebug!.nearby())).not.toBeNull();
  const other = await anchor();
  expect(other).not.toBeNull();
  expect(other).not.toBe(note);
  // The float offset never leaks into a new anchor: the marker stays within the tween range.
  await expect
    .poll(async () =>
      Math.abs((await page.evaluate(() => window.__lexiconDebug!.markerY()))! - other!),
    )
    .toBeLessThanOrEqual(4);
});

test('marker clears the player head when standing behind the archive terminal', async ({
  page,
}) => {
  await openWorld(page);
  await transitionAndWait(page, 'archive', 'from_office');
  // Feet at the top of the terminal footprint (y=956): the closest a player gets from behind.
  await page.evaluate(() => window.__lexiconDebug!.teleport(1500, 950));
  await expect
    .poll(() => page.evaluate(() => window.__lexiconDebug!.nearby()))
    .toBe('PLACEHOLDER_security_terminal');
  await expect.poll(() => page.evaluate(() => window.__lexiconDebug!.markerY())).not.toBeNull();
  const markerY = (await page.evaluate(() => window.__lexiconDebug!.markerY()))!;
  expect(markerY).toBeLessThan((await player(page)).y - 100);
});

test('paper overlay is subtle and does not block movement or interaction', async ({ page }) => {
  await openWorld(page);
  const alpha = await page.evaluate(() => window.__lexiconDebug!.paperOverlayAlpha());
  expect(alpha).not.toBeNull();
  expect(alpha!).toBeGreaterThanOrEqual(0.1);
  expect(alpha!).toBeLessThanOrEqual(0.18);

  const overlay = page.locator('.game-paper-overlay');
  await expect(overlay).toHaveCount(1);
  await expect(overlay).toHaveCSS('pointer-events', 'none');
  const topAtCenter = await page.evaluate(() => {
    const el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
    return { isOverlay: el?.classList.contains('game-paper-overlay') ?? false, tag: el?.tagName };
  });
  expect(topAtCenter.isOverlay).toBe(false);
  expect(topAtCenter.tag).toBe('CANVAS');
  const order = await page.evaluate(() => {
    const ov = document.querySelector('.game-paper-overlay')!;
    const canvas = document.querySelector('canvas')!;
    const hud = document.querySelector('.hud')!;
    return {
      afterCanvas: !!(canvas.compareDocumentPosition(ov) & Node.DOCUMENT_POSITION_FOLLOWING),
      beforeHud: !!(ov.compareDocumentPosition(hud) & Node.DOCUMENT_POSITION_FOLLOWING),
      overlayZ: getComputedStyle(ov).zIndex,
      hudZ: getComputedStyle(hud).zIndex,
    };
  });
  expect(order.afterCanvas).toBe(true);
  expect(order.beforeHud).toBe(true);
  expect(order.overlayZ).toBe(order.hudZ); // both auto: DOM order decides, HUD paints above

  const before = await player(page);
  await hold(page, 'd', 300);
  expect((await player(page)).x).toBeGreaterThan(before.x);

  await page.evaluate(() => window.__lexiconDebug!.teleport(1400, 1100));
  await expect
    .poll(() => page.evaluate(() => window.__lexiconDebug!.nearby()))
    .toBe('objective_note');
});

test('scene transition fades and lands at the spawn; repeated requests restart once', async ({
  page,
}) => {
  await openWorld(page);
  await page.evaluate(() => window.__lexiconDebug!.teleport(2100, 700));
  await expect(page.getByText('Ra hành lang', { exact: true })).toBeVisible();
  await page.keyboard.press('e');
  await page.keyboard.press('e');
  await expect(page.getByText('Quay lại Main Office', { exact: true })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.__lexiconDebug?.player() ?? null), { timeout: 1000 })
    .not.toBeNull();
  const after = await player(page);
  expect(after.x).toBeLessThan(2000);
  await expect(page.locator('canvas')).toHaveCount(1);
});

test('a transition requested during the arrival fade-in still switches scenes', async ({
  page,
}) => {
  await openWorld(page);
  // Request the return trip in the same tick the archive scene installs its hook, i.e. mid fade-in.
  const switchedBack = await page.evaluate(
    () =>
      new Promise<boolean>((resolve) => {
        const office = window.__lexiconDebug!;
        office.requestTransition('archive', 'from_office');
        let archive: typeof office | undefined;
        const deadline = performance.now() + 4000;
        const poll = () => {
          const current = window.__lexiconDebug;
          if (!archive && current && current !== office) {
            archive = current;
            archive.requestTransition('main_office', 'from_archive');
          } else if (archive && current && current !== archive) {
            resolve(true);
            return;
          }
          if (performance.now() > deadline) resolve(false);
          else requestAnimationFrame(poll);
        };
        poll();
      }),
  );
  expect(switchedBack).toBe(true);
});

test('real textures load without missing-texture or loader warnings', async ({ page }) => {
  const warnings: string[] = [];
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('[Scene] missing texture') || text.includes('[Assets] failed to load')) {
      warnings.push(text);
    }
  });
  await openWorld(page);
  expect(await page.evaluate(() => window.__lexiconDebug!.playerTexture())).toBe('tex_player_se');
  await page.evaluate(() => window.__lexiconDebug!.requestTransition('archive', 'from_office'));
  await expect(page.getByText('Quay lại Main Office', { exact: true })).toBeVisible();
  expect(warnings).toEqual([]);
});

test('player stops at the desk footprint when walking into it from the side', async ({ page }) => {
  await openWorld(page);
  // Left of the desk, level with its footprint; walking right must be blocked.
  await page.evaluate(() => window.__lexiconDebug!.teleport(1020, 800));
  await hold(page, 'd', 1500);
  const after = await player(page);
  expect(after.x).toBeLessThan(1200 - 75);
  expect(after.x).toBeGreaterThan(1020);
});

test('player texture follows the facing and keeps it while idle', async ({ page }) => {
  await openWorld(page);
  const texture = () => page.evaluate(() => window.__lexiconDebug!.playerTexture());
  expect(await texture()).toBe('tex_player_se');
  await hold(page, 'a', 200);
  // The idle still returns on the first Phaser update after key-up, so poll for it.
  await expect.poll(async () => (await playerAnim(page)).playing).toBe(false);
  await expect.poll(texture).toBe('tex_player_sw');
  await page.waitForTimeout(200);
  expect(await texture()).toBe('tex_player_sw');
  await page.keyboard.down('w');
  await page.keyboard.down('a');
  await page.waitForTimeout(200);
  // Checked while both keys are held: releasing them one by one resolves a single-axis facing.
  expect(await playerAnim(page)).toMatchObject({ key: 'player_walk_nw', playing: true });
  await page.keyboard.up('a');
  await page.keyboard.up('w');
});

async function playerAnim(
  page: Page,
): Promise<{ key: string | null; frame: number | null; playing: boolean }> {
  return page.evaluate(() => window.__lexiconDebug!.playerAnim());
}

/** Distinct walk frames seen while sampling for `ms`. */
async function framesDuring(page: Page, ms: number): Promise<Set<number>> {
  const seen = new Set<number>();
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const { frame } = await playerAnim(page);
    if (frame !== null) seen.add(frame);
    await page.waitForTimeout(20);
  }
  return seen;
}

test('walking plays the walk animation and stopping returns to the idle still', async ({
  page,
}) => {
  await openWorld(page);
  expect(await playerAnim(page)).toMatchObject({ playing: false });
  await page.keyboard.down('d');
  await expect.poll(async () => (await playerAnim(page)).playing).toBe(true);
  expect((await playerAnim(page)).key).toMatch(/^player_walk_/);
  expect((await framesDuring(page, 800)).size).toBeGreaterThanOrEqual(3);
  await page.keyboard.up('d');
  await expect.poll(async () => (await playerAnim(page)).playing).toBe(false);
  await expect
    .poll(() => page.evaluate(() => window.__lexiconDebug!.playerTexture()))
    .toBe('tex_player_se');
});

test('changing direction mid-walk switches the walk without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  await openWorld(page);
  await page.keyboard.down('a');
  await expect.poll(async () => (await playerAnim(page)).key).toBe('player_walk_sw');
  await page.waitForTimeout(250);
  await page.keyboard.up('a');
  await page.keyboard.down('d');
  await expect.poll(async () => (await playerAnim(page)).key).toBe('player_walk_se');
  expect((await playerAnim(page)).playing).toBe(true);
  await page.keyboard.up('d');
  await expect.poll(async () => (await playerAnim(page)).playing).toBe(false);
  await expect
    .poll(() => page.evaluate(() => window.__lexiconDebug!.playerTexture()))
    .toBe('tex_player_se');
  expect(errors).toEqual([]);
});

test('reduced motion keeps the walk animation (functional movement feedback)', async ({ page }) => {
  await openWorld(page);
  await page.keyboard.press('Escape');
  const pause = page.getByRole('dialog');
  await expect(pause).toBeVisible();
  await pause.getByLabel('Giảm chuyển động').check();
  await page.keyboard.press('Escape');
  await expect(pause).toBeHidden();
  await page.keyboard.down('d');
  await expect.poll(async () => (await playerAnim(page)).playing).toBe(true);
  expect((await framesDuring(page, 800)).size).toBeGreaterThanOrEqual(3);
  await page.keyboard.up('d');
});

async function transitionAndWait(page: Page, sceneId: string, spawnId: string): Promise<void> {
  const before = await page.evaluateHandle(() => window.__lexiconDebug);
  await page.evaluate(
    ([scene, spawn]) => window.__lexiconDebug!.requestTransition(scene!, spawn!),
    [sceneId, spawnId],
  );
  // The restarted scene installs a fresh debug hook once it is created.
  await page.waitForFunction(
    (previous) => window.__lexiconDebug !== undefined && window.__lexiconDebug !== previous,
    before,
  );
}

test('a destination texture that fails to load warns and the transition still completes', async ({
  page,
}) => {
  const failed = archiveOnlyTextures[0]!;
  await page.route(`**${failed.url}`, (route) => route.fulfill({ status: 404, body: '' }));
  const warnings: string[] = [];
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'warning') warnings.push(msg.text());
    if (msg.type() === 'error' && !msg.text().includes('404')) errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  await openWorld(page);
  await transitionAndWait(page, 'archive', 'from_office');
  await expect(page.getByText('Quay lại Main Office', { exact: true })).toBeVisible();
  expect(warnings).toContain(`[Assets] failed to load ${failed.key}`);
  expect(errors).toEqual([]);
  await expect(page.locator('canvas')).toHaveCount(1);
  // The scene is live: the player can still move.
  const before = await player(page);
  await hold(page, 'd', 300);
  expect((await player(page)).x).toBeGreaterThan(before.x);
});

test('scene textures load on entry only once across office and archive round trips', async ({
  page,
}) => {
  const requests = new Map<string, number>();
  page.on('request', (request) => {
    const { pathname } = new URL(request.url());
    if (pathname.startsWith('/assets/')) requests.set(pathname, (requests.get(pathname) ?? 0) + 1);
  });
  await openWorld(page);
  for (const { url } of archiveOnlyTextures) expect(requests.get(url) ?? 0, url).toBe(0);
  // Count only what the transitions request; the dev StrictMode double mount boots twice.
  requests.clear();

  await transitionAndWait(page, 'archive', 'from_office');
  await transitionAndWait(page, 'main_office', 'from_archive');
  await transitionAndWait(page, 'archive', 'from_office');
  await transitionAndWait(page, 'main_office', 'from_archive');

  for (const { url } of archiveOnlyTextures) expect(requests.get(url), url).toBe(1);
  for (const { url } of officeTextures) expect(requests.get(url) ?? 0, url).toBe(0);
  expect([...requests.values()].every((count) => count === 1)).toBe(true);
});

test('input is locked while a scene transition waits for its textures', async ({ page }) => {
  const slow = archiveOnlyTextures[0]!;
  await page.route(`**${slow.url}`, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await route.continue();
  });
  await openWorld(page);
  // Standing at the office door: Ra hanh lang is nearby, so E would fire an interaction.
  await page.evaluate(() => window.__lexiconDebug!.teleport(2100, 700));
  await expect.poll(() => page.evaluate(() => window.__lexiconDebug!.nearby())).not.toBeNull();
  const triggeredBefore = await page.evaluate(() => window.__lexiconDebug!.triggeredEvents());
  const office = await page.evaluateHandle(() => window.__lexiconDebug);
  await page.evaluate(() => window.__lexiconDebug!.requestTransition('archive', 'from_office'));

  // The old scene is still shown while the archive texture is in flight: it must be inert.
  await expect.poll(() => page.evaluate(() => window.__lexiconDebug!.nearby())).toBeNull();
  const before = await player(page);
  await page.keyboard.down('d');
  await page.keyboard.press('e');
  await page.waitForTimeout(500);
  await page.keyboard.up('d');
  expect((await player(page)).x).toBeCloseTo(before.x, 0);
  expect(await page.evaluate(() => window.__lexiconDebug!.nearby())).toBeNull();
  expect(await page.evaluate(() => window.__lexiconDebug!.markerY())).toBeNull();
  expect(await page.evaluate(() => window.__lexiconDebug!.triggeredEvents())).toBe(triggeredBefore);
  // Still waiting on the slow texture, i.e. this really was the loading window.
  expect(await page.evaluate((prev) => window.__lexiconDebug === prev, office)).toBe(true);

  await page.waitForFunction(
    (previous) => window.__lexiconDebug !== undefined && window.__lexiconDebug !== previous,
    office,
    { timeout: 10_000 },
  );
  await expect(page.getByText('Quay lại Main Office', { exact: true })).toBeVisible();
});

test('the dev transition hook goes through the store so it matches the shown scene', async ({
  page,
}) => {
  await openWorld(page);
  expect(await page.evaluate(() => window.__lexiconDebug!.storeSceneId())).toBe('main_office');
  await transitionAndWait(page, 'archive', 'from_office');
  expect(await page.evaluate(() => window.__lexiconDebug!.storeSceneId())).toBe('archive');
  await transitionAndWait(page, 'main_office', 'from_archive');
  expect(await page.evaluate(() => window.__lexiconDebug!.storeSceneId())).toBe('main_office');
});

test('pushing into the desk does not play the walk animation', async ({ page }) => {
  await openWorld(page);
  await page.evaluate(() => window.__lexiconDebug!.teleport(1020, 800));
  await page.keyboard.down('d');
  await expect.poll(async () => (await playerAnim(page)).playing).toBe(true);
  // Blocked by the desk footprint; keep pushing for 500 ms after the body stopped.
  await expect
    .poll(async () => (await player(page)).x, { intervals: [150], timeout: 5000 })
    .toBeGreaterThan(1000);
  await expect
    .poll(async () => {
      const a = (await player(page)).x;
      await page.waitForTimeout(150);
      return (await player(page)).x === a;
    })
    .toBe(true);
  await page.waitForTimeout(500);
  const anim = await playerAnim(page);
  const texture = await page.evaluate(() => window.__lexiconDebug!.playerTexture());
  await page.keyboard.up('d');
  expect(anim.playing).toBe(false);
  expect(texture).toBe('tex_player_se');
});
