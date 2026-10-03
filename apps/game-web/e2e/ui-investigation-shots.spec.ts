import { mkdirSync } from 'node:fs';
import { test } from '@playwright/test';
import { investigationScreens } from './investigationScreens';

// Opt-in screenshot set for the notebook, deduction board and accusation panel:
// UI_INVESTIGATION_SHOTS_DIR=<dir> npm run test:e2e -w @lexicon/game-web -- e2e/ui-investigation-shots.spec.ts
// The directory is resolved from apps/game-web (the Playwright cwd).
const dir = process.env.UI_INVESTIGATION_SHOTS_DIR;
const viewports = [
  { w: 1920, h: 1080 },
  { w: 1280, h: 720 },
  { w: 760, h: 600 },
  { w: 390, h: 844 },
  { w: 844, h: 390 },
  { w: 1280, h: 540 },
] as const;

test.describe('investigation desk screenshots (opt-in)', () => {
  test.skip(!dir, 'set UI_INVESTIGATION_SHOTS_DIR to capture screenshots');
  test.setTimeout(120_000);

  for (const screen of investigationScreens) {
    for (const { w, h } of viewports) {
      test(`${screen.name} ${w}x${h}`, async ({ page }) => {
        mkdirSync(dir!, { recursive: true });
        await page.setViewportSize({ width: w, height: h });
        await screen.reach(page);
        await page.waitForTimeout(600);
        await page.screenshot({ path: `${dir}/${screen.name}-${w}x${h}.png` });
      });
    }
  }
});
