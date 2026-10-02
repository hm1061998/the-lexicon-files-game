import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';
import {
  seedInvestigation,
  strings,
  definition,
  expectNoInvestigationScroll,
} from './investigationFixture';
test.setTimeout(90000);
test('notebook paginated and page turn adapter stays within viewport', async ({ page }) => {
  page.on('pageerror', (e) => console.log('Pagination pageerror:', e.message));
  await page.setViewportSize({ width: 760, height: 600 });
  await seedInvestigation(
    page,
    {
      flags: { anna_q1_read: true, leo_q1_read: true },
      evidenceIds: ['meeting_minutes', 'leo_phone_recording'],
    },
    true,
  );
  await page.keyboard.press('j');
  const dialog = page.getByRole('dialog', { name: strings.notebook, exact: true });
  await expect(dialog.locator('.measured-page').first()).toBeVisible();
  await expect(dialog.locator('.page-viewport').first()).not.toContainText(strings.pagePreparing);
  await expectNoInvestigationScroll(page, dialog);
  await dialog.getByRole('button', { name: strings.people, exact: true }).click();
  await expect(dialog.locator('.page-viewport').first()).not.toContainText(strings.pagePreparing);
  await expectNoInvestigationScroll(page, dialog);
  await page.screenshot({
    path: fileURLToPath(
      new URL(
        '../../../.superpowers/sdd/2026-10-02-investigation-no-scroll/notebook-760.png',
        import.meta.url,
      ),
    ),
  });
});

test('board paginated faces keep the selected fact pair', async ({ page }) => {
  await seedInvestigation(page, {
    flags: { anna_q1_read: true, leo_q1_read: true, david_q1_read: true },
    evidenceIds: definition.evidences.map((e) => e.id),
    discoveredFactIds: definition.facts.map((f) => f.id),
  });
  await page.keyboard.press('b');
  const board = page.locator('.deduction-board');
  await expect(board.locator('.deduction-face-tabs button')).toHaveCount(4);
  await board.getByRole('button', { name: strings.deductionCompareFace, exact: true }).click();
  await expect(board.locator('.page-viewport').first()).not.toContainText(strings.pagePreparing);
  const first = board.locator('.deduction-facts .page-viewport button').first();
  await first.click();
  await board.getByRole('button', { name: strings.deductionTimelineFace, exact: true }).click();
  await board.getByRole('button', { name: strings.deductionCompareFace, exact: true }).click();
  await expect(board.locator('.deduction-selection-count')).toHaveText(
    `${strings.contradictionSelectedCount}: 1/2`,
  );
  await expectNoInvestigationScroll(page, board);
});
