import { expect, type Page } from '@playwright/test';
import { chooseCase, openWorld } from './journeyHelpers';
import { seedInvestigation } from './investigationFixture';

export type Screen = {
  name: string;
  reach: (page: Page) => Promise<void>;
  /** Pre-dismiss the coach notes (only the in-game screens need it). */
  quietCoach?: boolean;
};

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

export const shellScreens: readonly Screen[] = [
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
    name: 'settings',
    reach: async (page) => {
      await toTitle(page);
      await page.getByRole('button', { name: 'Cài đặt', exact: true }).click();
      await expect(page.locator('.folder-cover select').first()).toBeVisible();
    },
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
    quietCoach: true,
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
