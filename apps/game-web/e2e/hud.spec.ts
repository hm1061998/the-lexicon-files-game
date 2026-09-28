import { expect, test, type Page } from '@playwright/test';

type DebugApi = {
  player(): { x: number; y: number; depth: number };
  nearby(): string | null;
  teleport(x: number, y: number): void;
  triggeredEvents(): number;
};

async function openWorld(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForFunction(
    () => (window as unknown as { __lexiconDebug?: DebugApi }).__lexiconDebug !== undefined,
  );
}

function debug(page: Page) {
  return {
    x: () =>
      page.evaluate(
        () => (window as unknown as { __lexiconDebug: DebugApi }).__lexiconDebug.player().x,
      ),
    triggered: () =>
      page.evaluate(() =>
        (window as unknown as { __lexiconDebug: DebugApi }).__lexiconDebug.triggeredEvents(),
      ),
  };
}

async function hold(page: Page, key: string, ms: number): Promise<void> {
  await page.keyboard.down(key);
  await page.waitForTimeout(ms);
  await page.keyboard.up(key);
}

test('prompt appears near the note and disappears when leaving', async ({ page }) => {
  await openWorld(page);
  await hold(page, 'd', 800);
  await expect(page.getByText('Đọc ghi chú')).toBeVisible();
  await hold(page, 'a', 1500);
  await expect(page.getByText('Đọc ghi chú')).toHaveCount(0);
});

test('canvas is not remounted by HUD updates', async ({ page }) => {
  await openWorld(page);
  await page.evaluate(() => {
    document.querySelector('canvas')!.dataset.marker = 'x';
  });
  const start = await page.evaluate(() =>
    (window as unknown as { __lexiconDebug: DebugApi }).__lexiconDebug.player(),
  );
  for (let i = 0; i < 2; i += 1) {
    await page.evaluate(
      ({ x, y }) =>
        (window as unknown as { __lexiconDebug: DebugApi }).__lexiconDebug.teleport(x, y),
      start,
    );
    await hold(page, 'd', 800);
    await expect(page.getByText('Đọc ghi chú')).toBeVisible();
    await hold(page, 'a', 1500);
    await expect(page.getByText('Đọc ghi chú')).toHaveCount(0);
  }
  await expect(page.locator('canvas')).toHaveCount(1);
  await expect(page.locator('canvas[data-marker="x"]')).toHaveCount(1);
});

test('Esc pauses and blocks movement', async ({ page }) => {
  await openWorld(page);
  const d = debug(page);
  await page.keyboard.press('Escape');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tiếp tục' })).toBeFocused();
  const before = await d.x();
  await hold(page, 'd', 500);
  expect(await d.x()).toBeCloseTo(before, 0);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  const resumed = await d.x();
  await hold(page, 'd', 500);
  expect(await d.x()).toBeGreaterThan(resumed);
});

test('E near the note triggers interaction once', async ({ page }) => {
  await openWorld(page);
  const d = debug(page);
  await hold(page, 'd', 800);
  await expect(page.getByText('Đọc ghi chú')).toBeVisible();
  await page.keyboard.press('e');
  await expect.poll(d.triggered).toBe(1);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('e');
  await page.waitForTimeout(200);
  expect(await d.triggered()).toBe(1);
});

test('HUD shows objective and case progress', async ({ page }) => {
  await openWorld(page);
  await expect(page.getByText('Tìm hiểu điều gì đã xảy ra với bản báo cáo')).toBeVisible();
  await expect(page.getByText('0/5')).toBeVisible();
});

test('reading the objective note completes the active objective', async ({ page }) => {
  await openWorld(page);
  await expect(page.getByText('Tìm hiểu điều gì đã xảy ra với bản báo cáo')).toBeVisible();
  await hold(page, 'd', 800);
  await expect(page.getByText('Đọc ghi chú')).toBeVisible();
  await page.keyboard.press('e');
  await expect(page.getByText('Tìm hiểu điều gì đã xảy ra với bản báo cáo')).toHaveCount(0);
});

test('Esc typed in a page input does not pause', async ({ page }) => {
  await openWorld(page);
  await page.evaluate(() => {
    const input = document.createElement('input');
    input.id = 'lexicon-esc-input';
    document.body.appendChild(input);
  });
  await page.focus('#lexicon-esc-input');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
