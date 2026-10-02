import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';
import {
  seedInvestigation,
  strings,
  definition,
  expectNoInvestigationScroll,
  readAllPages,
  turnToVisible,
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

for (const viewport of [
  { width: 844, height: 390 },
  { width: 390, height: 844 },
  { width: 1280, height: 720 },
]) {
  test(`popover no scroll ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await seedInvestigation(
      page,
      { flags: { anna_q1_read: true }, evidenceIds: ['meeting_minutes'] },
      true,
    );
    await page.keyboard.press('j');
    const dialog = page.getByRole('dialog', { name: strings.notebook, exact: true });
    await dialog.getByRole('button', { name: strings.people, exact: true }).click();
    const card = dialog.getByRole('button', { name: 'Anna Reed', exact: true });
    if (await card.isVisible()) await card.click();
    const person = dialog.locator('.notebook-person .measured-page');
    const word = await turnToVisible(
      person,
      dialog.getByRole('button', { name: /left\. Xem nghĩa từ/ }),
    );
    await word.click();
    const popup = dialog.locator('.investigation-vocabulary-popover');
    await expect(popup).toBeVisible();
    await expect(popup).toBeFocused();
    await expect(popup.locator('.page-viewport')).not.toContainText(strings.pagePreparing);

    const frame = (await dialog.boundingBox())!;
    const box = (await popup.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(frame.x - 1);
    expect(box.y).toBeGreaterThanOrEqual(frame.y - 1);
    expect(box.x + box.width).toBeLessThanOrEqual(frame.x + frame.width + 1);
    expect(box.y + box.height).toBeLessThanOrEqual(frame.y + frame.height + 1);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    const close = (await popup
      .getByRole('button', { name: strings.close, exact: true })
      .boundingBox())!;
    expect(close.width).toBeGreaterThanOrEqual(44);
    expect(close.height).toBeGreaterThanOrEqual(44);
    await expectNoInvestigationScroll(page, popup);

    // PageDown inside the popover turns only the popover, never the page underneath it.
    const underneath = person.locator('.page-controls span');
    const position = await underneath.innerText();
    await popup.focus();
    await page.keyboard.press('PageDown');
    expect(await underneath.innerText()).toBe(position);

    // The whole definition card stays reachable by turning the popover's own pages.
    const entry = definition.vocabulary.find((w) => w.lemma === 'leave')!;
    const text = await readAllPages(popup.locator('.measured-page'));
    expect(text).toContain(entry.definitionEn);
    expect(text).toContain(entry.examples[0]!);

    await page.keyboard.press('Escape');
    await expect(popup).toHaveCount(0);
    await expect(word).toBeFocused();
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  });
}
