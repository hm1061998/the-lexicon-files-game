import { expect, test } from '@playwright/test';
import { openWorld } from './journeyHelpers';

test('visible evidence and exits have one marker each across scene transitions', async ({
  page,
}) => {
  await openWorld(page);
  await expect.poll(() => page.evaluate(() => window.__lexiconDebug?.worldCueCount())).toBe(3);

  for (const [scene, spawn, count] of [
    ['archive', 'from_office', 2],
    ['main_office', 'from_archive', 3],
    ['archive', 'from_office', 2],
  ] as const) {
    const old = await page.evaluateHandle(() => window.__lexiconDebug);
    await page.evaluate(
      ([sceneId, spawnId]) => window.__lexiconDebug!.requestTransition(sceneId!, spawnId!),
      [scene, spawn],
    );
    await page.waitForFunction((previous) => window.__lexiconDebug !== previous, old);
    await expect
      .poll(() => page.evaluate(() => window.__lexiconDebug?.worldCueCount()))
      .toBe(count);
  }
});
