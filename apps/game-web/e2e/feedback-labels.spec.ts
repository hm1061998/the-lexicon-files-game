import { expect, test } from '@playwright/test';
test('mounted label textures are released across scene restarts', async ({ page }) => {
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => window.__lexiconDebug?.labelTextureCount())).toBe(3);
  for (const [scene, spawn, count] of [
    ['archive', 'from_office', 2],
    ['main_office', 'from_archive', 3],
    ['archive', 'from_office', 2],
  ] as const) {
    const old = await page.evaluateHandle(() => window.__lexiconDebug);
    await page.evaluate(
      ([scene, spawn]) => window.__lexiconDebug!.requestTransition(scene!, spawn!),
      [scene, spawn],
    );
    await page.waitForFunction((old) => window.__lexiconDebug !== old, old);
    await expect
      .poll(() => page.evaluate(() => window.__lexiconDebug?.labelTextureCount()))
      .toBe(count);
  }
});
