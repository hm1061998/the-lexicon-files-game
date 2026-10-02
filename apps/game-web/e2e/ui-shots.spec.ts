import { mkdirSync } from 'node:fs';
import { test, type Page } from '@playwright/test';
import { scenePoint } from './sceneTestData';
import { interactAt, openWorld } from './journeyHelpers';

// Opt-in screenshot set for UI verification: UI_SHOTS_DIR=<dir> npm run test:e2e -w @lexicon/game-web -- e2e/ui-shots.spec.ts
const dir = process.env.UI_SHOTS_DIR;
const viewports = [
  { w: 1920, h: 1080 },
  { w: 1280, h: 720 },
  { w: 760, h: 600 },
  { w: 390, h: 844 },
] as const;

async function shot(page: Page, name: string, w: number, h: number): Promise<void> {
  // Let the camera settle and the paper cue/transition animations finish.
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${dir}/${name}-${w}x${h}.png` });
}

test.describe('UI screenshots (opt-in)', () => {
  test.skip(!dir, 'set UI_SHOTS_DIR to capture screenshots');
  test.setTimeout(120_000);

  for (const { w, h } of viewports) {
    test(`capture ${w}x${h}`, async ({ page }) => {
      mkdirSync(dir!, { recursive: true });
      await page.setViewportSize({ width: w, height: h });
      await openWorld(page);
      await shot(page, 'enter-game', w, h);

      const evidence = scenePoint('main_office', 'meeting_minutes');
      await page.evaluate(({ x, y }) => window.__lexiconDebug!.teleport(x, y), evidence);
      await shot(page, 'near-evidence', w, h);

      const door = scenePoint('main_office', 'hallway_door');
      await page.evaluate(({ x, y }) => window.__lexiconDebug!.teleport(x, y), door);
      await shot(page, 'near-portal', w, h);

      // Far corner of the room: pickups fall outside the camera frame.
      await page.evaluate(() => window.__lexiconDebug!.teleportLogical(14, 9));
      await shot(page, 'evidence-offscreen', w, h);

      await interactAt(page, evidence.x, evidence.y, 'Đọc biên bản cuộc họp');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(150);
      await page.screenshot({ path: `${dir}/objective-change-${w}x${h}.png` });
    });
  }
});
