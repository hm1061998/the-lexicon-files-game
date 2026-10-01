import { mkdirSync } from 'node:fs';
import { expect, test } from '@playwright/test';

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

test('camera zooms closer, follows the player, and stays inside the scene bounds', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await expect.poll(async () => (await cameraState(page))?.zoom ?? 0).toBeGreaterThanOrEqual(1.2);
  expect((await cameraState(page))!.zoom).toBeLessThan(1.22);
  await page.evaluate(() => window.__lexiconDebug!.teleportLogical(8, 8));
  await page.waitForTimeout(250);
  const output = '../../.superpowers/sdd/2026-10-01-phase-11e-camera-audio-ui-addendum';
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
  await page.goto('/');
  await expect.poll(async () => (await cameraState(page))?.zoom ?? 0).toBeGreaterThanOrEqual(1.2);
  const output = '../../.superpowers/sdd/2026-10-01-phase-11e-camera-audio-ui-addendum';
  mkdirSync(output, { recursive: true });
  await page.screenshot({ path: `${output}/camera-compact-760x600.png` });
  await page.setViewportSize({ width: 1280, height: 720 });
  await expect.poll(async () => (await cameraState(page))?.zoom ?? 0).toBeGreaterThanOrEqual(1.2);
});
