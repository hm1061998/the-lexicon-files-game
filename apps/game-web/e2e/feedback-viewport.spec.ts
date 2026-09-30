import { expect, test } from '@playwright/test';

for (const size of [
  { width: 760, height: 600 },
  { width: 1024, height: 768 },
  { width: 1280, height: 720 },
  { width: 1920, height: 1080 },
]) {
  test(`shell fits ${size.width}x${size.height} including letterbox`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto('/');
    await expect(page.locator('.hud-key-hints')).toBeVisible();
    const check = async () => {
      const bounds = await page.evaluate(() => {
        const root = document.querySelector('.game-root')!;
        const canvas = document.querySelector('canvas')!;
        const r = root.getBoundingClientRect(),
          c = canvas.getBoundingClientRect();
        return {
          width: innerWidth,
          height: innerHeight,
          scrollWidth: document.documentElement.scrollWidth,
          scrollHeight: document.documentElement.scrollHeight,
          x: r.x,
          y: r.y,
          w: r.width,
          h: r.height,
          cx: c.x,
          cy: c.y,
          cw: c.width,
          ch: c.height,
          bg: getComputedStyle(document.body).backgroundColor,
          rootBg: getComputedStyle(root).backgroundColor,
        };
      });
      expect(bounds.scrollWidth).toBeLessThanOrEqual(bounds.width);
      expect(bounds.scrollHeight).toBeLessThanOrEqual(bounds.height);
      expect([bounds.x, bounds.y, bounds.w, bounds.h]).toEqual([0, 0, bounds.width, bounds.height]);
      expect(bounds.cx).toBeGreaterThanOrEqual(0);
      expect(bounds.cy).toBeGreaterThanOrEqual(0);
      expect(bounds.cx + bounds.cw).toBeLessThanOrEqual(bounds.width + 1);
      expect(bounds.cy + bounds.ch).toBeLessThanOrEqual(bounds.height + 1);
      expect(bounds.bg).toBe('rgb(42, 37, 33)');
      expect(bounds.rootBg).toBe(bounds.bg);
    };
    await check();
    await page.setViewportSize({ width: 900, height: 680 });
    await expect
      .poll(async () => (await page.locator('.game-root').boundingBox())?.width)
      .toBe(900);
    await check();
    await page.keyboard.press('j');
    const notebook = page.locator('.notebook-panel');
    await expect(notebook).toBeVisible();
    await expect(notebook.getByRole('button', { name: /Đóng/ }).first()).toBeInViewport();
    expect(await notebook.evaluate((node) => getComputedStyle(node).overflowY)).toBe('auto');
    await check();
    await page.keyboard.press('Escape');
    await expect(notebook).toHaveCount(0);
  });
}
