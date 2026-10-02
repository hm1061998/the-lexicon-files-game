import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { openWorld } from './journeyHelpers';
import { scenePoint } from './sceneTestData';

const office = JSON.parse(
  readFileSync(
    new URL(
      '../../../packages/game-content/cases/case-001/scenes/main_office.json',
      import.meta.url,
    ),
    'utf8',
  ),
) as {
  labels: Array<{
    id: string;
    u: number;
    mount?: { kind: string; wallId?: string };
  }>;
};

test('investigation room label stays within the visible back-wall segment', () => {
  const label = office.labels.find(({ id }) => id === 'label_investigation_room');
  expect(label).toMatchObject({ u: 6, mount: { kind: 'wall', wallId: 'wall_back' } });
  expect(label!.u - 2).toBeGreaterThan(0);
  expect(label!.u + 2).toBeLessThan(16);
});

test('NPC dossier tags show by proximity, not on entry', async ({ page }) => {
  await openWorld(page);
  await expect.poll(() => page.evaluate(() => Boolean(window.__lexiconDebug))).toBe(true);
  // The default spawn is inside Anna's and Leo's radius but well outside David's.
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => window.__lexiconDebug!.nameplateVisible('david'))).toBe(false);
  const anna = scenePoint('main_office', 'anna', { u: 0.3, v: 0.6 });
  await page.evaluate(({ x, y }) => window.__lexiconDebug!.teleport(x, y), anna);
  await expect
    .poll(() => page.evaluate(() => window.__lexiconDebug!.nameplateVisible('anna')))
    .toBe(true);
  const far = scenePoint('main_office', 'hallway_door');
  await page.evaluate(({ x, y }) => window.__lexiconDebug!.teleport(x, y), far);
  await expect
    .poll(() => page.evaluate(() => window.__lexiconDebug!.nameplateVisible('anna')))
    .toBe(false);
});

test('NPC nameplate uses the paper dossier style without covering the figure', async ({ page }) => {
  await openWorld(page);
  await expect.poll(() => page.evaluate(() => Boolean(window.__lexiconDebug))).toBe(true);
  const nameplate = await page.evaluate(() => {
    const debug = window.__lexiconDebug as
      | (typeof window.__lexiconDebug & {
          npcNameplate?: (
            id: string,
          ) => { text: string; hasPaperPlate: boolean; textColor: string; gap: number } | undefined;
        })
      | undefined;
    return debug?.npcNameplate?.('anna');
  });
  expect(nameplate).toMatchObject({
    text: 'Anna Reed',
    hasPaperPlate: true,
    textColor: '#2A2521',
  });
  expect(nameplate!.gap).toBeGreaterThanOrEqual(6);
});

test('mounted label textures are released across scene restarts', async ({ page }) => {
  await openWorld(page);
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
