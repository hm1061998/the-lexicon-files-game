import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  expectComfortableControls,
  expectNoInvestigationScroll,
  strings,
} from './investigationFixture';
import { investigationScreens } from './investigationScreens';

const VIEWPORTS = [
  { width: 1280, height: 720 },
  { width: 760, height: 600 },
  { width: 390, height: 844 },
  { width: 1280, height: 540 },
  { width: 844, height: 390 },
] as const;

const dialogOf = (page: Page, screenName: string): Locator =>
  screenName.startsWith('notebook')
    ? page.getByRole('dialog', { name: strings.notebook, exact: true })
    : page.locator('.deduction-board');

// The investigation red (#a4412d) and the dark red (#743026) as computed rgb().
const REDS = ['rgb(164, 65, 45)', 'rgb(116, 48, 38)'];

test.describe('Notebook, board and accusation', () => {
  test.setTimeout(120_000);

  for (const screen of investigationScreens) {
    for (const viewport of VIEWPORTS) {
      test(`${screen.name} ${viewport.width}x${viewport.height}: no scroll, comfortable controls`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);
        await screen.reach(page);
        const dialog = dialogOf(page, screen.name);
        await expect(
          dialog.locator('.page-viewport:visible').filter({ hasText: strings.pagePreparing }),
        ).toHaveCount(0);
        await expectNoInvestigationScroll(page, dialog);
        await expectComfortableControls(dialog);
        const box = (await dialog.boundingBox())!;
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.y).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
        expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
      });
    }
  }

  for (const screen of investigationScreens) {
    test(`${screen.name}: red only marks a selection`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await screen.reach(page);
      const strays = await dialogOf(page, screen.name).evaluate((root, reds) => {
        const marked = (node: Element) =>
          node.matches('[aria-pressed="true"], .pinned-card--selected') ||
          node.closest('.pinned-card--selected') !== null;
        return Array.from(root.querySelectorAll<HTMLElement>('button'))
          .filter((n) => n.getClientRects().length && !n.closest('.page-measurement'))
          .filter((n) => !marked(n))
          .filter((n) => {
            const style = getComputedStyle(n);
            return [style.color, style.backgroundColor, style.borderTopColor].some((c) =>
              reds.includes(c),
            );
          })
          .map((n) => `${n.className} "${(n.textContent ?? '').trim().slice(0, 24)}"`);
      }, REDS);
      expect(strays).toEqual([]);
    });
  }

  test('reduced motion lays the pinned cards flat', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1280, height: 720 });
    await investigationScreens.find((s) => s.name === 'board-clues')!.reach(page);
    const card = page.locator('.deduction-board .pinned-card').first();
    await expect(card).toBeVisible();
    await expect(card).toHaveCSS('transform', 'none');
    await expect(page.locator('.deduction-board')).toHaveCSS('animation-name', 'none');
  });

  test('a horizontal swipe turns the notebook page, and the turn plays on the whole spread', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await investigationScreens.find((s) => s.name === 'notebook-vocabulary')!.reach(page);
    const dialog = dialogOf(page, 'notebook-vocabulary');
    const label = dialog.locator('.page-controls__label');
    await expect(label).toHaveText(/^Trang 1\/\d+$/);
    const area = (await dialog.locator('.spread-leaves').boundingBox())!;
    const y = area.y + area.height / 2;
    // A short or vertical drag is not a swipe.
    await page.mouse.move(area.x + 300, y);
    await page.mouse.down();
    await page.mouse.move(area.x + 280, y + 4);
    await page.mouse.up();
    await expect(label).toHaveText(/^Trang 1\/\d+$/);
    await page.mouse.move(area.x + 400, y);
    await page.mouse.down();
    await page.mouse.move(area.x + 200, y + 6, { steps: 6 });
    await page.mouse.up();
    await expect(label).toHaveText(/^Trang 2\/\d+$/);
    await page.mouse.move(area.x + 200, y);
    await page.mouse.down();
    await page.mouse.move(area.x + 400, y + 6, { steps: 6 });
    await page.mouse.up();
    await expect(label).toHaveText(/^Trang 1\/\d+$/);
  });

  test('the two leaves of an open notebook hold one reading, and the turn sweeps both', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await investigationScreens.find((s) => s.name === 'notebook-people')!.reach(page);
    const dialog = dialogOf(page, 'notebook-people');
    await expect(dialog.locator('.spread-leaf--left')).toBeVisible();
    await expect(dialog.locator('.spread-leaf--right')).toBeVisible();
    // One pager for the pair, and one page-turn surface around both leaves.
    await expect(dialog.locator('.page-controls')).toHaveCount(1);
    expect(await dialog.locator('.page-turn-surface').count()).toBe(1);
    const inside = await dialog.evaluate((el) => {
      const surface = el.querySelector('.page-turn-surface')!;
      return (
        surface.contains(el.querySelector('.spread-leaf--left')) &&
        surface.contains(el.querySelector('.spread-leaf--right'))
      );
    });
    expect(inside).toBe(true);
  });

  test('a click that wobbles a pixel still picks a fact, and a vertical drag moves the list', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await investigationScreens.find((s) => s.name === 'board-compare')!.reach(page);
    const board = page.locator('.deduction-board');
    const fact = board.locator('.compare-fact').first();
    const box = (await fact.boundingBox())!;
    // Press near the right edge of the page and wobble one pixel: that is a click, not a drag.
    await page.mouse.move(box.x + box.width - 10, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 10, box.y + box.height / 2 + 1);
    await page.mouse.up();
    await expect(fact).toHaveAttribute('aria-pressed', 'true');
    // Dragging the list upwards scrolls it down by roughly the distance dragged.
    const list = board.locator('.compare-facts .swipe-row');
    const before = await list.evaluate((el) => el.scrollTop);
    const listBox = (await list.boundingBox())!;
    await page.mouse.move(listBox.x + 30, listBox.y + listBox.height - 20);
    await page.mouse.down();
    await page.mouse.move(listBox.x + 30, listBox.y + 20, { steps: 8 });
    await page.mouse.up();
    const after = await list.evaluate((el) => el.scrollTop);
    const scrollable = await list.evaluate((el) => el.scrollHeight > el.clientHeight + 1);
    if (scrollable) expect(after).toBeGreaterThan(before);
  });
});
