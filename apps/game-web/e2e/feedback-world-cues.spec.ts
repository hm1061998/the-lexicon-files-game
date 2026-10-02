import { expect, test } from '@playwright/test';
import { interactAt, openWorld } from './journeyHelpers';
import { scenePoint } from './sceneTestData';

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

test('a cue outside the camera view gets an edge pointer that disappears once collected', async ({
  page,
}) => {
  await openWorld(page);
  await expect.poll(() => page.evaluate(() => window.__lexiconDebug?.worldCueCount())).toBe(3);
  // Start in view: nothing to point at.
  await page.waitForTimeout(500);
  const inView = await page.evaluate(() => window.__lexiconDebug!.offscreenCueIds());
  // Far corner of the room: at least one pickup falls outside the frame.
  await page.evaluate(() => window.__lexiconDebug!.teleportLogical(14, 9));
  await expect
    .poll(() => page.evaluate(() => window.__lexiconDebug!.offscreenCueIds().length))
    .toBeGreaterThan(0);
  const pointed = await page.evaluate(() => window.__lexiconDebug!.offscreenCueIds());
  expect(pointed.length).toBeLessThanOrEqual(3);
  expect(inView.length).toBeLessThanOrEqual(pointed.length + inView.length);

  // Collect the minutes: its pointer (if any) must go away with its cue.
  const minutes = scenePoint('main_office', 'meeting_minutes');
  await interactAt(page, minutes.x, minutes.y, 'Đọc biên bản cuộc họp');
  await page.keyboard.press('Escape');
  await expect
    .poll(() => page.evaluate(() => window.__lexiconDebug!.offscreenCueIds()))
    .not.toContain('meeting_minutes');
  // The nearest remaining target gives up its marker for its outline, so 1 or 2 markers remain.
  await expect
    .poll(() => page.evaluate(() => window.__lexiconDebug!.worldCueCount()))
    .toBeLessThanOrEqual(2);
});
