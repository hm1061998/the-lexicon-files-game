import { mkdirSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { scenePoint } from './sceneTestData';

for (const size of [
  { width: 760, height: 600 },
  { width: 1024, height: 768 },
  { width: 1280, height: 720 },
  { width: 1920, height: 1080 },
]) {
  test(`shell fits ${size.width}x${size.height} including letterbox`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto('/');
    if (size.width < 960 || size.height < 640)
      await expect(page.locator('.hud-key-hints')).toBeHidden();
    else await expect(page.locator('.hud-key-hints')).toBeVisible();
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

test('compact HUD panels keep 44px launchers and preserve manual visibility through resize', async ({
  page,
}) => {
  await page.setViewportSize({ width: 760, height: 600 });
  await page.goto('/');
  const objective = page.getByRole('button', { name: 'Mở mục tiêu' });
  const map = page.getByRole('button', { name: 'Mở bản đồ' });
  await expect(objective).toBeVisible();
  await expect(map).toBeVisible();
  for (const launcher of [objective, map]) {
    const bounds = await launcher.boundingBox();
    expect(bounds?.width).toBeGreaterThanOrEqual(44);
    expect(bounds?.height).toBeGreaterThanOrEqual(44);
  }
  await objective.click();
  await map.click();
  await expect(page.getByRole('button', { name: 'Thu gọn mục tiêu' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  await page.setViewportSize({ width: 1280, height: 720 });
  await expect(page.locator('.hud-objective-panel')).toBeVisible();
  await expect(page.locator('.hud-minimap')).toBeVisible();
});

test('captures compact gameplay and a close interaction prompt for review', async ({ page }) => {
  const output = '../../.superpowers/sdd/2026-09-30-phase-11e-feedback-polish';
  mkdirSync(output, { recursive: true });
  await page.setViewportSize({ width: 760, height: 600 });
  await page.goto('/');
  await page.waitForFunction(() => window.__lexiconDebug !== undefined);
  await page.screenshot({ path: `${output}/compact-760x600.png` });

  await page.setViewportSize({ width: 1280, height: 720 });
  const note = scenePoint('main_office', 'objective_note');
  await page.evaluate(({ x, y }) => window.__lexiconDebug!.teleport(x, y), note);
  const prompt = page.locator('.hud-interaction-prompt');
  await expect(prompt).toBeVisible();
  await prompt.screenshot({ path: `${output}/interaction-prompt.png` });
});
