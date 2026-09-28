import { expect, test, type Page } from '@playwright/test';

type DebugApi = {
  player(): { x: number; y: number; depth: number };
  depthOf(id: string): number;
  nearby(): string | null;
  nearbyEvents(): number;
  teleport(x: number, y: number): void;
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

test('player moves right while D is held', async ({ page }) => {
  await openWorld(page);
  const before = await player(page);
  await hold(page, 'd', 500);
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
  await hold(page, 'd', 800);
  const nearWhileIn = await page.evaluate(() => window.__lexiconDebug!.nearby());
  expect(nearWhileIn).toBe('objective_note');
  await hold(page, 'a', 1500);
  const nearAfterLeaving = await page.evaluate(() => window.__lexiconDebug!.nearby());
  expect(nearAfterLeaving).toBeNull();
});

test('nearby event fires once per entry', async ({ page }) => {
  await openWorld(page);
  await hold(page, 'd', 800);
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
