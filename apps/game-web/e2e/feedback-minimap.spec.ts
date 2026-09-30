import { expect, test } from '@playwright/test';

test('minimap follows short movement in all four directions and resets on scene change', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await expect(page.locator('.minimap-player')).toBeVisible();
  for (const key of ['w', 'a', 's', 'd']) {
    await page.evaluate(() => window.__lexiconDebug!.teleportLogical(10, 9));
    await expect.poll(() => page.locator('.minimap-player').getAttribute('cx')).toBe('896');
    const before = await page.locator('.minimap-player').getAttribute('cy');
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
            ? await dot.getAttribute('cx')
            : await dot.getAttribute('cy');
        },
        { timeout: 500 },
      )
      .not.toBe(key === 'a' || key === 'd' ? '896' : before);
    // Independent 2:1 oracle, with at most the documented two-pixel publishing threshold.
    await expect
      .poll(
        async () =>
          Math.abs(
            Number(await page.locator('.minimap-player').getAttribute('cx')) -
              (832 + (player.u - player.v) * 64),
          ),
        { timeout: 500 },
      )
      .toBeLessThanOrEqual(2.1);
    await expect
      .poll(
        async () =>
          Math.abs(
            Number(await page.locator('.minimap-player').getAttribute('cy')) -
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
    .poll(async () => Number(await page.locator('.minimap-player').getAttribute('cx')))
    .not.toBe(896);
});
