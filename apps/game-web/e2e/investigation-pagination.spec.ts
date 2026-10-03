import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';
import {
  seedInvestigation,
  strings,
  definition,
  expectNoInvestigationScroll,
  expectComfortableControls,
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
  const first = board.locator('.compare-fact').first();
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
    await expect(popup.locator('.page-controls')).toHaveCount(0);
    await page.screenshot({
      path: fileURLToPath(
        new URL(
          `../../../docs/ai/playtests/2026-10-02-investigation-pagination/popover-${viewport.width}x${viewport.height}.png`,
          import.meta.url,
        ),
      ),
    });

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

    // The whole definition card is reachable: long entries scroll inside the note, with no pages and no bar.
    const entry = definition.vocabulary.find((w) => w.lemma === 'leave')!;
    const text = (await popup.innerText()).replace(/\s+/g, ' ');
    expect(text).toContain(entry.definitionEn);
    expect(text).toContain(entry.examples[0]!);
    await expect(popup.locator('.swipe-row')).toHaveCSS('overflow-y', 'auto');

    await page.keyboard.press('Escape');
    await expect(popup).toHaveCount(0);
    await expect(word).toBeFocused();
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  });
}

test('Tab stays inside the notebook on a one-page evidence sheet', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await seedInvestigation(page, { evidenceIds: ['meeting_minutes'] }, true);
  await page.keyboard.press('j');
  const dialog = page.getByRole('dialog', { name: strings.notebook, exact: true });
  await dialog.getByRole('button', { name: strings.evidence, exact: true }).click();
  await dialog.locator('.notebook-index-card').first().click();
  const review = dialog.getByRole('button', { name: strings.evidenceReview, exact: true });
  await expect(review).toBeVisible();
  const inside = () => dialog.evaluate((el) => el.contains(document.activeElement));
  const close = dialog
    .locator('.notebook-header')
    .getByRole('button', { name: strings.close, exact: true });
  await close.focus();
  for (let i = 0; i < 40; i += 1) {
    await page.keyboard.press('Tab');
    expect(await inside()).toBe(true);
  }
  await close.focus();
  const before = await page.evaluate(() => document.activeElement?.outerHTML.slice(0, 80));
  await page.keyboard.press('Shift+Tab');
  const after = await page.evaluate(() => document.activeElement?.outerHTML.slice(0, 80));
  expect(after).not.toBe(before);
  expect(await inside()).toBe(true);
});

test('focus stays on the pager after turning to the last page', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await seedInvestigation(
    page,
    { flags: { anna_q1_read: true, anna_q2_read: true, anna_q3_read: true } },
    true,
  );
  await page.keyboard.press('j');
  const dialog = page.getByRole('dialog', { name: strings.notebook, exact: true });
  await dialog.getByRole('button', { name: strings.people, exact: true }).click();
  const card = dialog.getByRole('button', { name: 'Anna Reed', exact: true });
  if (await card.isVisible()) await card.click();
  const scope = dialog.locator('.notebook-person .measured-page');
  const next = scope.getByRole('button', { name: /Trang sau/ });
  expect(await next.isEnabled()).toBe(true);
  await next.focus();
  for (let i = 0; i < 12 && (await next.isEnabled()); i += 1) {
    await page.keyboard.press('Enter');
    await expect.poll(() => scope.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  }
  expect(await next.isEnabled()).toBe(false);
  await expect.poll(() => scope.evaluate((el) => el.contains(document.activeElement))).toBe(true);
});

test('each valid page turn plays one paper cue and an edge press plays none', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await seedInvestigation(
    page,
    { flags: { anna_q1_read: true, anna_q2_read: true, anna_q3_read: true } },
    true,
  );
  await page.keyboard.press('j');
  const dialog = page.getByRole('dialog', { name: strings.notebook, exact: true });
  await dialog.getByRole('button', { name: strings.people, exact: true }).click();
  const card = dialog.getByRole('button', { name: 'Anna Reed', exact: true });
  if (await card.isVisible()) await card.click();
  const scope = dialog.locator('.notebook-person .measured-page');
  const next = scope.getByRole('button', { name: /Trang sau/ });
  const previous = scope.getByRole('button', { name: /Trang trước/ });
  const cues = () => page.evaluate(() => window.__lexiconDebug!.paperCues());
  for (let i = 0; i < 40 && (await previous.isEnabled()); i += 1) await previous.click();
  const start = await cues();
  expect(await next.isEnabled()).toBe(true);
  await next.click();
  await expect.poll(cues).toBe(start + 1);
  await previous.click();
  await expect.poll(cues).toBe(start + 2);
  // Pressing PageUp on the first page is not a turn.
  await scope.locator('.page-viewport').first().focus();
  await page.keyboard.press('PageUp');
  await page.waitForTimeout(150);
  expect(await cues()).toBe(start + 2);
});

test('controls stay at least 44px with 14px text on every viewport', async ({ page }) => {
  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await seedInvestigation(
      page,
      { flags: { anna_q1_read: true }, evidenceIds: ['meeting_minutes'] },
      true,
    );
    await page.keyboard.press('j');
    const dialog = page.getByRole('dialog', { name: strings.notebook, exact: true });
    await expect(dialog).toBeVisible();
    await expectComfortableControls(dialog);
    await page.keyboard.press('Escape');
    await page.keyboard.press('b');
    const board = page.locator('.deduction-board');
    await expect(board).toBeVisible();
    await expectComfortableControls(board);
    await page.keyboard.press('Escape');
  }
});
