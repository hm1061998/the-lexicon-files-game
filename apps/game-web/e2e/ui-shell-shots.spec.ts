import { mkdirSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { chooseCase, openWorld, seedOnboardingSeen } from './journeyHelpers';
import { seedInvestigation } from './investigationFixture';

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

type Screen = { name: string; reach: (page: Page) => Promise<void> };

const newCase = (page: Page) => page.getByRole('button', { name: 'Vụ án mới', exact: true });

async function toTitle(page: Page): Promise<void> {
  await page.goto('/');
  await chooseCase(page);
}

/** Writes a save (a fresh game saves nothing until it changes), then returns to the title. */
async function withSave(page: Page): Promise<void> {
  await seedInvestigation(page);
  await page.reload();
  await chooseCase(page);
}

const screens: readonly Screen[] = [
  {
    name: 'case-picker',
    reach: async (page) => {
      await page.goto('/');
      await expect(page.locator('.case-card').first()).toBeVisible();
    },
  },
  { name: 'title-new', reach: toTitle },
  {
    name: 'title-saved',
    reach: withSave,
  },
  {
    name: 'support',
    reach: async (page) => {
      await toTitle(page);
      await newCase(page).click();
      await expect(page.getByRole('dialog')).toBeVisible();
    },
  },
  {
    name: 'confirm',
    reach: async (page) => {
      await withSave(page);
      await newCase(page).click();
      await expect(page.getByRole('alertdialog')).toBeVisible();
    },
  },
  {
    name: 'pause',
    reach: async (page) => {
      await openWorld(page);
      await page.keyboard.press('Escape');
      await expect(page.locator('.pause-menu')).toBeVisible();
    },
  },
  {
    name: 'briefing',
    reach: async (page) => {
      await toTitle(page);
      await newCase(page).click();
      await page.getByRole('button', { name: 'Dùng mặc định' }).click();
      await expect(page.locator('.briefing-memo')).toBeVisible();
    },
  },
  {
    name: 'summary',
    reach: async (page) => {
      await seedInvestigation(page, { flags: { case_closed: true } });
      await expect(page.getByText('CASE CLOSED', { exact: true })).toBeVisible();
    },
  },
];

test.describe('UI shell screenshots (opt-in)', () => {
  test.skip(!dir, 'set UI_SHELL_SHOTS_DIR to capture screenshots');
  test.setTimeout(120_000);

  for (const screen of screens) {
    for (const { w, h } of viewports) {
      test(`${screen.name} ${w}x${h}`, async ({ page }) => {
        mkdirSync(dir!, { recursive: true });
        await page.setViewportSize({ width: w, height: h });
        await seedOnboardingSeen(page);
        await screen.reach(page);
        await page.waitForTimeout(600);
        await page.screenshot({ path: `${dir}/${screen.name}-${w}x${h}.png` });
      });
    }
  }
});
