import { mkdirSync } from 'node:fs';
import { test } from '@playwright/test';
import { seedOnboardingSeen } from './journeyHelpers';
import { shellScreens } from './shellScreens';

// Opt-in screenshot set for the UI shell:
// UI_SHELL_SHOTS_DIR=<dir> npm run test:e2e -w @lexicon/game-web -- e2e/ui-shell-shots.spec.ts
// The directory is resolved from apps/game-web (the Playwright cwd).
const dir = process.env.UI_SHELL_SHOTS_DIR;
const viewports = [
  { w: 1920, h: 1080 },
  { w: 1280, h: 720 },
  { w: 760, h: 600 },
  { w: 390, h: 844 },
] as const;

test.describe('UI shell screenshots (opt-in)', () => {
  test.skip(!dir, 'set UI_SHELL_SHOTS_DIR to capture screenshots');
  test.setTimeout(120_000);

  for (const screen of shellScreens) {
    for (const { w, h } of viewports) {
      test(`${screen.name} ${w}x${h}`, async ({ page }) => {
        mkdirSync(dir!, { recursive: true });
        await page.setViewportSize({ width: w, height: h });
        if (screen.quietCoach) await seedOnboardingSeen(page);
        await screen.reach(page);
        await page.waitForTimeout(600);
        await page.screenshot({ path: `${dir}/${screen.name}-${w}x${h}.png` });
      });
    }
  }
});
