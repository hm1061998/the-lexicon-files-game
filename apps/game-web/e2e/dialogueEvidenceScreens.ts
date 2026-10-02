import { expect, type Page } from '@playwright/test';
import { openWorld, pressInteract } from './journeyHelpers';
import { scenePoint } from './sceneTestData';
import type { Screen } from './shellScreens';

async function teleportTo(page: Page, id: string): Promise<void> {
  await page.evaluate(
    ({ x, y }) => window.__lexiconDebug!.teleport(x, y),
    scenePoint('main_office', id),
  );
}

async function openDialogue(page: Page): Promise<void> {
  await openWorld(page);
  // Anna's first line carries vocabulary spans, so the definition card can be opened from it.
  await page.evaluate(
    ({ x, y }) => window.__lexiconDebug!.teleport(x, y),
    scenePoint('main_office', 'anna', { u: 0.3, v: 0.6 }),
  );
  await expect(page.getByText('Nói chuyện với Anna', { exact: true })).toBeVisible();
  await pressInteract(page);
  await expect(page.locator('.dialogue-panel')).toBeVisible();
}

/** In-game screens of the dialogue and evidence UI; openWorld already skips the coach notes. */
export const dialogueEvidenceScreens: readonly Screen[] = [
  { name: 'dialogue', reach: openDialogue },
  {
    name: 'evidence',
    reach: async (page) => {
      await openWorld(page);
      await teleportTo(page, 'meeting_minutes');
      await expect(page.getByText('Đọc biên bản cuộc họp')).toBeVisible();
      await pressInteract(page);
      await expect(page.getByRole('dialog')).toContainText('Meeting Minutes');
    },
  },
  {
    name: 'listening',
    reach: async (page) => {
      await openWorld(page);
      await teleportTo(page, 'phone_recording');
      await expect(page.getByText('Nghe bản ghi điện thoại của Leo')).toBeVisible();
      await pressInteract(page);
      await expect(page.getByRole('dialog')).toContainText("Leo's Phone Recording");
      await expect(page.locator('.listening-task')).toBeVisible();
    },
  },
  {
    name: 'vocab-in-dialogue',
    reach: async (page) => {
      await openDialogue(page);
      await page.locator('.dialogue-text .vocabulary-word').first().click();
      await expect(page.locator('.dialogue-panel .vocabulary-popover')).toBeVisible();
    },
  },
];
