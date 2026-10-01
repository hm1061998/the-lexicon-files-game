import { expect, test } from '@playwright/test';

test('minimap follows short movement in all four directions and resets on scene change', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await expect(page.locator('.minimap-player')).toBeVisible();
  for (const key of ['w', 'a', 's', 'd']) {
    await page.evaluate(() => window.__lexiconDebug!.teleportLogical(10, 9));
    await expect
      .poll(() => page.locator('.minimap-player').getAttribute('data-world-x'))
      .toBe('896');
    const before = await page.locator('.minimap-player').getAttribute('data-world-y');
    await page.keyboard.down(key);
    await page.waitForTimeout(150);
    await page.keyboard.up(key);
    const player = await page.evaluate(() => window.__lexiconDebug!.logicalPlayer()!);
    expect(Math.hypot(player.u - 10, player.v - 9)).toBeLessThan(2);
    await expect
      .poll(
        async () => {
          const dot = page.locator('.minimap-player');
          return key === 'a' || key === 'd'
            ? await dot.getAttribute('data-world-x')
            : await dot.getAttribute('data-world-y');
        },
        { timeout: 500 },
      )
      .not.toBe(key === 'a' || key === 'd' ? '896' : before);
    // Independent 2:1 oracle, with at most the documented two-pixel publishing threshold.
    await expect
      .poll(
        async () =>
          Math.abs(
            Number(await page.locator('.minimap-player').getAttribute('data-world-x')) -
              (832 + (player.u - player.v) * 64),
          ),
        { timeout: 500 },
      )
      .toBeLessThanOrEqual(2.1);
    await expect
      .poll(
        async () =>
          Math.abs(
            Number(await page.locator('.minimap-player').getAttribute('data-world-y')) -
              (180 + (player.u + player.v) * 32),
          ),
        { timeout: 500 },
      )
      .toBeLessThanOrEqual(2.1);
  }
  await page.evaluate(() => window.__lexiconDebug!.requestTransition('archive', 'from_office'));
  await expect
    .poll(() => page.evaluate(() => window.__lexiconDebug?.storeSceneId()))
    .toBe('archive');
  await expect
    .poll(async () => Number(await page.locator('.minimap-player').getAttribute('data-world-x')))
    .not.toBe(896);
});

test('player has visible CSS size on desktop and compact', async ({ page }) => {
  await page.goto('/');
  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 760, height: 600 },
  ]) {
    await page.setViewportSize(viewport);
    const dot = page.locator('.minimap-player');
    await expect(dot).toBeVisible();
    const box = await dot.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(8);
    expect(box!.width).toBeLessThanOrEqual(10);
    expect(box!.height).toBeGreaterThanOrEqual(8);
    expect(box!.height).toBeLessThanOrEqual(10);
  }
});
