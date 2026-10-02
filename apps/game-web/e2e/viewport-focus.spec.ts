import { expect, test, type Locator, type Page } from '@playwright/test';
import { scenePoint } from './sceneTestData';
import { openWorld } from './journeyHelpers';

// Multi-panel keyboard traversal includes geometry checks at every focus step.
// Keep strict visibility/scroll assertions while allowing the full sequence on busy CI hosts.
test.setTimeout(90_000);

async function stableViewport(page: Page) {
  expect(await page.locator('.game-root').evaluate((el) => el.scrollTop)).toBe(0);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  const canvas = (await page.locator('canvas').boundingBox())!;
  expect(canvas.y).toBeGreaterThanOrEqual(0);
}

async function insideViewport(page: Page, control: Locator) {
  const rect = (await control.boundingBox())!;
  expect(rect.y).toBeGreaterThanOrEqual(0);
  expect(rect.y + rect.height).toBeLessThanOrEqual(page.viewportSize()!.height);
}

async function focusedInsidePanel(page: Page, panel: Locator) {
  await insideViewport(page, page.locator(':focus'));
  expect(
    await panel.evaluate((el) => {
      const focus = document.activeElement!;
      const r = focus.getBoundingClientRect();
      const p = el.getBoundingClientRect();
      return (
        el.contains(focus) &&
        r.top >= p.top + el.clientTop &&
        r.bottom <= p.top + el.clientTop + el.clientHeight
      );
    }),
  ).toBe(true);
}

for (const viewport of [
  { width: 760, height: 600 },
  { width: 1280, height: 720 },
]) {
  test(`keyboard vocabulary then notebook keeps viewport stable ${viewport.width}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await openWorld(page);
    await page.waitForFunction(() => window.__lexiconDebug !== undefined);
    await expect(page.locator('canvas')).toHaveCount(1);
    await expect(page.locator('canvas')).toBeVisible();
    await page.waitForTimeout(1200);
    await page.keyboard.down('ArrowLeft');
    await page.keyboard.down('ArrowDown');
    await page.waitForTimeout(350);
    await page.keyboard.up('ArrowLeft');
    await page.keyboard.up('ArrowDown');
    await page.keyboard.press('e');
    await expect(page.locator('.dialogue-panel')).toBeVisible();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(page.locator('.vocabulary-popover')).toBeVisible();
    await stableViewport(page);
    await insideViewport(page, page.locator('.vocabulary-popover'));
    await page.keyboard.press('Escape');
    await expect(page.locator('.vocabulary-popover')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await page.keyboard.press('j');
    await expect(page.locator('.notebook-panel')).toBeVisible();
    await stableViewport(page);
    await insideViewport(page, page.locator('.notebook-panel'));
    await insideViewport(
      page,
      page.locator('.notebook-header').getByRole('button', { name: 'Đóng', exact: true }),
    );
    await page
      .locator('.notebook-header')
      .getByRole('button', { name: 'Đóng', exact: true })
      .click();
    await page.keyboard.press('Escape');
    await expect(page.locator('.pause-menu')).toBeVisible();
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      await stableViewport(page);
      await insideViewport(page, page.locator(':focus'));
    }
    await page.getByRole('button', { name: 'Tiếp tục', exact: false }).click();
    await stableViewport(page);
  });
}

test('compact evidence scrolls internally and returns to a visible close control', async ({
  page,
}) => {
  await page.setViewportSize({ width: 760, height: 360 });
  await openWorld(page);
  await page.waitForFunction(() => window.__lexiconDebug !== undefined);
  const point = scenePoint('main_office', 'meeting_minutes');
  await page.evaluate(({ x, y }) => window.__lexiconDebug!.teleport(x, y), point);
  await expect(page.getByText('Đọc biên bản cuộc họp', { exact: true })).toBeVisible();
  await page.keyboard.press('e');
  const panel = page.locator('.evidence-modal');
  await expect(panel).toBeVisible();
  await insideViewport(page, panel);
  let evidenceScrolled = false;
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    await focusedInsidePanel(page, panel);
    await stableViewport(page);
    evidenceScrolled ||= (await panel.evaluate((el) => el.scrollTop)) > 0;
  }
  expect(evidenceScrolled).toBe(true);
  const close = panel.getByRole('button', { name: 'Đóng', exact: true });
  for (let i = 0; i < 12 && !(await close.evaluate((el) => el === document.activeElement)); i++) {
    await page.keyboard.press('Shift+Tab');
    await focusedInsidePanel(page, panel);
  }
  expect(await close.evaluate((el) => el === document.activeElement)).toBe(true);
  await page.keyboard.press('Enter');
  await expect(panel).toHaveCount(0);
  await stableViewport(page);
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 760, height: 240 });
  await expect(page.locator('.pause-menu')).toBeVisible();
  await insideViewport(page, page.locator('.pause-menu'));
  let scrolled = false;
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab');
    await focusedInsidePanel(page, page.locator('.pause-menu'));
    await stableViewport(page);
    scrolled ||= (await page.locator('.pause-menu').evaluate((el) => el.scrollTop)) > 0;
  }
  expect(scrolled).toBe(true);
});
