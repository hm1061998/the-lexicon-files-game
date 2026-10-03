import { mkdirSync } from 'node:fs';
import { test, type Page } from '@playwright/test';
import { dialogueEvidenceScreens } from './dialogueEvidenceScreens';
import { shellScreens } from './shellScreens';
import type { Screen } from './shellScreens';

// Opt-in screenshot set for the game-feel phase:
// UI_SHOTS_DIR=<dir> [UI_SHOTS_PHASE=before] npm run test:e2e -w @lexicon/game-web -- e2e/ui-game-feel-shots.spec.ts
// The directory is resolved from apps/game-web (the Playwright cwd). The conversation log does
// not exist before this phase, so `UI_SHOTS_PHASE=before` skips it.
const dir = process.env.UI_SHOTS_DIR;
const before = process.env.UI_SHOTS_PHASE === 'before';
const viewports = [
  { w: 1920, h: 1080 },
  { w: 1280, h: 720 },
  { w: 760, h: 600 },
  { w: 390, h: 844 },
] as const;

const byName = (list: readonly Screen[], name: string): Screen =>
  list.find((screen) => screen.name === name)!;

const dialogueLog: Screen = {
  name: 'dialogue-log',
  reach: async (page: Page) => {
    await byName(dialogueEvidenceScreens, 'dialogue').reach(page);
    await page.keyboard.press('l');
    await page.locator('.dialogue-log').waitFor();
  },
};

const screens: readonly Screen[] = [
  byName(dialogueEvidenceScreens, 'dialogue'),
  dialogueLog,
  byName(dialogueEvidenceScreens, 'listening'),
  byName(dialogueEvidenceScreens, 'evidence'),
  { ...byName(shellScreens, 'title-new'), name: 'title' },
  byName(shellScreens, 'pause'),
];

test.describe('Game-feel screenshots (opt-in)', () => {
  test.skip(!dir, 'set UI_SHOTS_DIR to capture screenshots');
  test.setTimeout(120_000);

  for (const screen of screens) {
    for (const { w, h } of viewports) {
      test(`${screen.name} ${w}x${h}`, async ({ page }) => {
        test.skip(before && screen.name === 'dialogue-log', 'the log is new in this phase');
        mkdirSync(dir!, { recursive: true });
        await page.setViewportSize({ width: w, height: h });
        await screen.reach(page);
        await page.waitForTimeout(600);
        await page.screenshot({ path: `${dir}/${screen.name}-${w}x${h}.png` });
      });
    }
  }
});
