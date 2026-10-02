import { mkdirSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { openWorld } from './journeyHelpers';

type CameraState = {
  zoom: number;
  scrollX: number;
  scrollY: number;
  view: { x: number; y: number; width: number; height: number };
  bounds: { x: number; y: number; width: number; height: number };
};

async function cameraState(
  page: import('@playwright/test').Page,
): Promise<CameraState | undefined> {
  return page.evaluate(() => {
    const debug = window.__lexiconDebug as
      (typeof window.__lexiconDebug & { cameraState?: () => CameraState }) | undefined;
    return debug?.cameraState?.();
  });
}

async function expectCameraContainsPlayer(page: import('@playwright/test').Page) {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const debug = window.__lexiconDebug;
        if (!debug) return false;
        const { view, bounds } = debug.cameraState();
        const player = debug.player();
        return (
          view.x >= bounds.x - 2 &&
          view.y >= bounds.y - 2 &&
          view.x + view.width <= bounds.x + bounds.width + 2 &&
          view.y + view.height <= bounds.y + bounds.height + 2 &&
          player.x >= view.x &&
          player.x <= view.x + view.width &&
          player.y >= view.y &&
          player.y <= view.y + view.height
        );
      }),
    )
    .toBe(true);
}

test('Office and Archive keep the player visible and clamp all four edges through resize', async ({
  page,
}) => {
  await openWorld(page);
  await page.waitForFunction(() => window.__lexiconDebug !== undefined);
  for (const sceneId of ['main_office', 'archive']) {
    if (sceneId === 'archive') {
      await page.evaluate(() => window.__lexiconDebug!.requestTransition('archive', 'from_office'));
      await expect
        .poll(() => page.evaluate(() => window.__lexiconDebug?.logicalPlayer()?.u))
        .toBe(14.5);
    }
    for (const viewport of [
      { width: 760, height: 600 },
      { width: 1280, height: 720 },
    ]) {
      await page.setViewportSize(viewport);
      for (const [u, v] of [
        [0.5, 0.5],
        [15.5, 0.5],
        [0.5, 11.5],
        [15.5, 11.5],
      ]) {
        await page.evaluate(([u, v]) => window.__lexiconDebug!.teleportLogical(u!, v!), [u, v]);
        await expectCameraContainsPlayer(page);
      }
    }
  }
});

test('camera zooms closer, follows the player, and stays inside the scene bounds', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await openWorld(page);
  await expect.poll(async () => (await cameraState(page))?.zoom ?? 0).toBeGreaterThanOrEqual(1.8);
  expect((await cameraState(page))!.zoom).toBeLessThan(1.82);
  await page.evaluate(() => window.__lexiconDebug!.teleportLogical(8, 8));
  await page.waitForTimeout(250);
  const output = '../../.superpowers/sdd/2026-10-01-phase-11e-navigation-portals';
  mkdirSync(output, { recursive: true });
  await page.screenshot({ path: `${output}/camera-desktop-1280x720.png` });

  const before = await cameraState(page);
  await page.keyboard.down('d');
  await page.waitForTimeout(900);
  await page.keyboard.up('d');
  await expect
    .poll(async () => {
      const current = await cameraState(page);
      return (
        current && Math.hypot(current.scrollX - before!.scrollX, current.scrollY - before!.scrollY)
      );
    })
    .toBeGreaterThan(0);

  await page.evaluate(() => window.__lexiconDebug!.teleportLogical(0.3, 0.3));
  await page.waitForTimeout(300);
  const edge = await cameraState(page);
  expect(edge).toBeDefined();
  expect(edge!.view.x).toBeGreaterThanOrEqual(edge!.bounds.x - 2);
  expect(edge!.view.y).toBeGreaterThanOrEqual(edge!.bounds.y - 2);
  expect(edge!.view.x + edge!.view.width).toBeLessThanOrEqual(
    edge!.bounds.x + edge!.bounds.width + 2,
  );
  expect(edge!.view.y + edge!.view.height).toBeLessThanOrEqual(
    edge!.bounds.y + edge!.bounds.height + 2,
  );
});

test('camera remains clamped on compact viewport and reapplies the world-fit zoom after resize', async ({
  page,
}) => {
  await page.setViewportSize({ width: 760, height: 600 });
  await openWorld(page);
  await expect.poll(async () => (await cameraState(page))?.zoom ?? 0).toBe(1.6);
  const output = '../../.superpowers/sdd/2026-10-01-phase-11e-navigation-portals';
  mkdirSync(output, { recursive: true });
  await page.screenshot({ path: `${output}/camera-compact-760x600.png` });
  await page.setViewportSize({ width: 1280, height: 720 });
  await expect.poll(async () => (await cameraState(page))?.zoom ?? 0).toBeGreaterThanOrEqual(1.8);
});
