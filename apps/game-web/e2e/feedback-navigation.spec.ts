import { expect, test, type Page } from '@playwright/test';
import { scenePoint } from './sceneTestData';
import { mkdirSync } from 'node:fs';
async function worldClick(page: Page, point: { x: number; y: number }) {
  await page.waitForTimeout(1500);
  const view = await page.evaluate(() => window.__lexiconDebug!.cameraState().view);
  const box = (await page.locator('canvas').boundingBox())!;
  await page.mouse.click(
    box.x + ((point.x - view.x) / view.width) * box.width,
    box.y + ((point.y - view.y) / view.height) * box.height,
  );
}
test('arrow keys match WASD and HUD controls work with mouse', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.__lexiconDebug !== undefined);
  const travel = async (keys: string[]) => {
    await page.evaluate(() => window.__lexiconDebug!.teleportLogical(10, 9));
    for (const key of keys) await page.keyboard.down(key);
    await page.waitForTimeout(300);
    // Sample inside the page so CDP latency does not enter the speed.
    const sample = await page.evaluate(async () => {
      const a = window.__lexiconDebug!.logicalPlayer()!;
      const t0 = performance.now();
      await new Promise((resolve) => setTimeout(resolve, 500));
      const b = window.__lexiconDebug!.logicalPlayer()!;
      return { u: b.u - a.u, ms: performance.now() - t0 };
    });
    for (const key of keys) await page.keyboard.up(key);
    return sample;
  };
  const wasd = await travel(['d']),
    arrow = await travel(['ArrowRight']),
    paired = await travel(['d', 'ArrowRight']);
  // Movement dt is clamped per frame, so speed follows the machine's FPS (20-40% noise under load).
  // A broken mapping is far outside that: arrow not moving gives 0, paired keys stacking gives 2x.
  const speed = (p: { u: number; ms: number }) => p.u / p.ms;
  expect(speed(wasd)).toBeGreaterThan(0);
  expect(speed(arrow) / speed(wasd)).toBeGreaterThan(0.6);
  expect(speed(arrow) / speed(wasd)).toBeLessThan(1.4);
  expect(speed(paired) / speed(wasd)).toBeGreaterThan(0.6);
  expect(speed(paired) / speed(wasd)).toBeLessThan(1.4);
  await page.getByRole('button', { name: 'Tạm dừng', exact: false }).click();
  await expect(page.getByLabel('Chế độ dịch')).toBeVisible();
});
test('click floor navigates and keyboard interrupts without resuming', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.__lexiconDebug !== undefined);
  await page.evaluate(() => window.__lexiconDebug!.teleportLogical(10, 9));
  await worldClick(page, { x: 832 + (11 - 9) * 64, y: 180 + (11 + 9) * 32 });
  await expect
    .poll(async () => {
      const p = await page.evaluate(() => window.__lexiconDebug!.logicalPlayer()!);
      return Math.hypot((p.u - 11) * 64, (p.v - 9) * 64);
    })
    .toBeLessThan(4);
  await worldClick(page, { x: 832 + (13 - 9) * 64, y: 180 + (13 + 9) * 32 });
  await page.keyboard.press('ArrowLeft');
  const p = await page.evaluate(() => window.__lexiconDebug!.logicalPlayer()!);
  await page.waitForTimeout(700);
  const after = await page.evaluate(() => window.__lexiconDebug!.logicalPlayer()!);
  expect(Math.hypot(after.u - p.u, after.v - p.v)).toBeLessThan(0.1);
});
test('distant NPC needs a second click after approach', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.__lexiconDebug !== undefined);
  const anchor = scenePoint('main_office', 'anna');
  await page.evaluate(() => window.__lexiconDebug!.teleportLogical(8, 4.8));
  await worldClick(page, { x: anchor.x, y: anchor.y - 35 });
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => window.__lexiconDebug!.nearby()), { timeout: 12000 })
    .toBe('anna');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await worldClick(page, { x: anchor.x, y: anchor.y - 35 });
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('mouse collects desk evidence and opens notebook without world input through HUD', async ({
  page,
}) => {
  await page.goto('/');
  await page.waitForFunction(() => window.__lexiconDebug !== undefined);
  await page.evaluate(() => window.__lexiconDebug!.teleportLogical(5.5, 9.5));
  await page.getByRole('button', { name: 'Thu gọn mục tiêu', exact: false }).click();
  const note = scenePoint('main_office', 'meeting_minutes');
  await worldClick(page, { x: note.x, y: note.y - 55 });
  await expect(page.getByRole('dialog')).toHaveCount(0);
  // Evidence on one table share a prompt; nearby() is the nearest, so assert the route reached
  // the clicked evidence radius instead.
  await expect
    .poll(
      async () => {
        const p = await page.evaluate(() => window.__lexiconDebug!.player());
        return Math.hypot(p.x - note.x, p.y - note.y);
      },
      { timeout: 12000 },
    )
    .toBeLessThanOrEqual(88);
  await page.waitForTimeout(700);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await worldClick(page, { x: note.x, y: note.y - 55 });
  await expect(page.getByRole('dialog')).toContainText('Meeting Minutes');
  const before = await page.evaluate(() => window.__lexiconDebug!.logicalPlayer()!);
  await page.getByRole('button', { name: 'Đóng', exact: true }).click();
  await page.getByRole('button', { name: 'Mở sổ tay', exact: false }).click();
  await expect(page.locator('.notebook-panel')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Meeting Minutes', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Đóng', exact: true }).click();
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => window.__lexiconDebug!.logicalPlayer()!)).toEqual(before);
});

test('double click opens only one NPC interaction and does not skip dialogue', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.__lexiconDebug !== undefined);
  const anchor = scenePoint('main_office', 'anna');
  await page.evaluate(() => window.__lexiconDebug!.teleportLogical(8, 6));
  await page.waitForTimeout(1500);
  const view = await page.evaluate(() => window.__lexiconDebug!.cameraState().view);
  const box = (await page.locator('canvas').boundingBox())!;
  await page.mouse.dblclick(
    box.x + ((anchor.x - view.x) / view.width) * box.width,
    box.y + ((anchor.y - 35 - view.y) / view.height) * box.height,
  );
  await expect(page.locator('.dialogue-panel')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'What time did you leave?', exact: false }),
  ).toBeVisible();
});

test('portals need explicit clicks and support both directions by mouse', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.__lexiconDebug !== undefined);
  await page.evaluate(() => window.__lexiconDebug!.teleportLogical(5.5, 5.5));
  await page.getByRole('button', { name: 'Thu gọn mục tiêu', exact: false }).click();
  const portal = scenePoint('main_office', 'hallway_door');
  await worldClick(page, portal);
  expect(await page.evaluate(() => window.__lexiconDebug!.storeSceneId())).toBe('main_office');
  await expect
    .poll(() => page.evaluate(() => window.__lexiconDebug!.nearby()), { timeout: 12000 })
    .toBe('hallway_door');
  await page.waitForTimeout(1000);
  expect(await page.evaluate(() => window.__lexiconDebug!.storeSceneId())).toBe('main_office');
  const output = '../../.superpowers/sdd/2026-10-01-phase-11e-navigation-portals';
  mkdirSync(output, { recursive: true });
  await page.screenshot({ path: `${output}/office-portal-desktop.png` });
  await worldClick(page, portal);
  await expect
    .poll(() => page.evaluate(() => window.__lexiconDebug!.storeSceneId()))
    .toBe('archive');
  await expect
    .poll(() => page.evaluate(() => window.__lexiconDebug!.nearby()))
    .toBe('PLACEHOLDER_archive_door');
  await page.waitForTimeout(800);
  expect(await page.evaluate(() => window.__lexiconDebug!.storeSceneId())).toBe('archive');
  await page.screenshot({ path: `${output}/archive-portal-desktop.png` });
  await page.setViewportSize({ width: 760, height: 600 });
  await page.screenshot({ path: `${output}/archive-portal-compact.png` });
  await worldClick(page, scenePoint('archive', 'PLACEHOLDER_archive_door'));
  await expect
    .poll(() => page.evaluate(() => window.__lexiconDebug!.storeSceneId()))
    .toBe('main_office');
  await page.screenshot({ path: `${output}/office-portal-compact.png` });
});

test('resized click coordinates and modal cancellation do not resume an old route', async ({
  page,
}) => {
  await page.goto('/');
  await page.waitForFunction(() => window.__lexiconDebug !== undefined);
  for (const size of [
    { width: 1280, height: 720 },
    { width: 760, height: 600 },
  ]) {
    await page.setViewportSize(size);
    await page.evaluate(() => window.__lexiconDebug!.teleportLogical(10, 9));
    await worldClick(page, { x: 960, y: 820 });
    await expect
      .poll(async () => {
        const p = await page.evaluate(() => window.__lexiconDebug!.logicalPlayer()!);
        return Math.hypot((p.u - 11) * 64, (p.v - 9) * 64);
      })
      .toBeLessThan(4);
  }
  await worldClick(page, { x: 1088, y: 884 });
  await page.getByRole('button', { name: 'Tạm dừng', exact: false }).click();
  const before = await page.evaluate(() => window.__lexiconDebug!.logicalPlayer()!);
  await page.getByRole('button', { name: 'Tiếp tục', exact: false }).click();
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => window.__lexiconDebug!.logicalPlayer()!)).toEqual(before);
});
