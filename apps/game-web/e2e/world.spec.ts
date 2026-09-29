import { expect, test, type Page } from '@playwright/test';

type DebugApi = {
  player(): { x: number; y: number; depth: number };
  depthOf(id: string): number;
  nearby(): string | null;
  nearbyEvents(): number;
  teleport(x: number, y: number): void;
  markerY(): number | null;
  paperOverlayAlpha(): number | null;
  requestTransition(sceneId: string, spawnId: string): void;
};

declare global {
  interface Window {
    __lexiconDebug?: DebugApi;
  }
}

async function openWorld(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForFunction(() => window.__lexiconDebug !== undefined);
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

  await pause.getByLabel('Giảm chuyển động').uncheck();
  await page.waitForTimeout(200);
  const e = await markerY();
  await page.waitForTimeout(500);
  const f = await markerY();
  expect(e).not.toBe(f);
});

test('paper overlay is subtle and does not block movement or interaction', async ({ page }) => {
  await openWorld(page);
  const alpha = await page.evaluate(() => window.__lexiconDebug!.paperOverlayAlpha());
  expect(alpha).not.toBeNull();
  expect(alpha!).toBeGreaterThanOrEqual(0.1);
  expect(alpha!).toBeLessThanOrEqual(0.18);

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
