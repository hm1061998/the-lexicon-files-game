import { expect, test, type Page } from '@playwright/test';

async function open(page: Page) {
  await page.goto('/');
  await page.waitForFunction(() => window.__lexiconDebug !== undefined);
  await page.evaluate(() => window.__lexiconDebug!.teleportLogical(10, 9));
}
async function position(page: Page) {
  return page.evaluate(() => window.__lexiconDebug!.logicalPlayer()!);
}
test('minimap drawing, player marker, legend and padding consume clicks', async ({ page }) => {
  await open(page);
  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 760, height: 600 },
  ]) {
    await page.setViewportSize(viewport);
    if (!(await page.locator('.hud-minimap').isVisible()))
      await page.getByRole('button', { name: 'Mở bản đồ', exact: false }).click();
    await expect(page.locator('.hud-minimap')).toBeVisible();
    const before = await position(page);
    const triggered = await page.evaluate(() => window.__lexiconDebug!.triggeredEvents());
    for (const selector of ['.minimap-svg', '.minimap-player', '.minimap-legend', '.hud-minimap']) {
      const box = (await page.locator(selector).first().boundingBox())!;
      const point =
        selector === '.hud-minimap'
          ? { x: box.x + 2, y: box.y + 2 }
          : { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      await page.mouse.click(point.x, point.y);
      await page.waitForTimeout(350);
      // A leaked click can be rejected as invalid/occluded without changing position.
      // No world command may be received at all, including commands that cancel a route.
      expect(await page.evaluate(() => window.__lexiconDebug!.pointerState()), selector).toBeNull();
      expect(await position(page), selector).toEqual(before);
      expect(await page.evaluate(() => window.__lexiconDebug!.triggeredEvents()), selector).toBe(
        triggered,
      );
    }
  }
});
test('held arrow and native repeat stay suppressed after pause until release', async ({ page }) => {
  await open(page);
  await page.keyboard.down('ArrowRight');
  await expect.poll(async () => (await position(page)).u).toBeGreaterThan(10.1);
  await page.getByRole('button', { name: 'Tạm dừng', exact: false }).click();
  await expect(page.getByLabel('Chế độ dịch')).toBeVisible();
  const before = await position(page);
  await page.getByRole('button', { name: 'Tiếp tục', exact: false }).click();
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() =>
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'ArrowRight',
          code: 'ArrowRight',
          keyCode: 39,
          which: 39,
          repeat: true,
          bubbles: true,
        }),
      ),
    );
    await page.waitForTimeout(120);
  }
  expect(await position(page)).toEqual(before);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.down('ArrowRight');
  await expect.poll(async () => (await position(page)).u).toBeGreaterThan(before.u + 0.1);
  await page.keyboard.up('ArrowRight');
});
test('native range and text arrows work without moving the world or replaying held keys', async ({
  page,
}) => {
  await open(page);
  await page.getByRole('button', { name: 'Tạm dừng', exact: false }).click();
  const range = page.locator('input[type=range]').first();
  await range.fill('40');
  await range.focus();
  const before = await position(page);
  await page.keyboard.press('ArrowRight');
  await expect(range).toHaveValue('45');
  expect(await position(page)).toEqual(before);
  await page.getByRole('button', { name: 'Tiếp tục', exact: false }).click();
  await page.evaluate(() => {
    const input = document.createElement('input');
    input.id = 'navigation-form';
    input.value = 'abcd';
    input.style.cssText = 'position:fixed;top:300px;left:20px;z-index:999';
    document.body.append(input);
    input.focus();
    input.setSelectionRange(2, 2);
  });
  await page.keyboard.press('ArrowLeft');
  expect(
    await page
      .locator('#navigation-form')
      .evaluate((el) => (el as HTMLInputElement).selectionStart),
  ).toBe(1);
  await page.keyboard.down('d');
  await page.waitForTimeout(200);
  expect(await position(page)).toEqual(before);
  await page.locator('#navigation-form').evaluate((el) => (el as HTMLInputElement).blur());
  await page.waitForTimeout(200);
  expect(await position(page)).toEqual(before);
  await page.keyboard.up('d');
});

async function clickWorld(page: Page, point: { x: number; y: number }) {
  await page.waitForTimeout(1500);
  const view = await page.evaluate(() => window.__lexiconDebug!.cameraState().view);
  const box = (await page.locator('canvas').boundingBox())!;
  await page.mouse.click(
    box.x + ((point.x - view.x) / view.width) * box.width,
    box.y + ((point.y - view.y) / view.height) * box.height,
  );
}
test('actual wall texture transparent corner permits floor navigation while opaque pixels consume clicks', async ({
  page,
}) => {
  await open(page);
  await page.evaluate(() => window.__lexiconDebug!.teleportLogical(1.453125, 8.515625));
  await page.getByRole('button', { name: 'Thu gọn mục tiêu', exact: false }).click();
  // partition_office_meeting_n:1: floor(1.5,7.125), frame80x130, origin(.5,110/130).
  // Both the start and transparent corner leave room for the body, away from furniture.
  const transparent = { x: 444, y: 467 },
    opaque = { x: 444, y: 446 };
  const alphas = await page.evaluate(async () => {
    const image = new Image();
    image.src = '/assets/environment/office/wall_u.png';
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = 80;
    canvas.height = 130;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, 0, 0);
    return [ctx.getImageData(12, 121, 1, 1).data[3], ctx.getImageData(12, 100, 1, 1).data[3]];
  });
  expect(alphas).toEqual([0, 255]);
  expect(
    await page.evaluate(() => window.__lexiconDebug!.alphaOf('partition_office_meeting_n:1')),
  ).toBe(1);
  await clickWorld(page, transparent);
  const command = await page.evaluate(() => window.__lexiconDebug!.pointerState());
  expect(command?.status).toBe('found');
  expect(command?.targetId).toBeNull();
  await expect
    .poll(async () => {
      const p = await page.evaluate(() => window.__lexiconDebug!.player());
      return Math.hypot(p.x - transparent.x, p.y - transparent.y);
    })
    .toBeLessThanOrEqual(3);
  await page.evaluate(() => window.__lexiconDebug!.teleportLogical(1.453125, 8.515625));
  await clickWorld(page, opaque);
  expect((await page.evaluate(() => window.__lexiconDebug!.pointerState()))?.status).toBe(
    'occluded',
  );
  const before = await position(page);
  await page.waitForTimeout(600);
  expect(await position(page)).toEqual(before);
});
test('repeated desktop and compact resize preserves the clicked floor point', async ({ page }) => {
  test.setTimeout(90_000);
  await open(page);
  const point = { x: 960, y: 820 };
  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 760, height: 600 },
    { width: 1280, height: 720 },
    { width: 760, height: 600 },
    { width: 1280, height: 720 },
    { width: 760, height: 600 },
  ]) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => window.__lexiconDebug!.teleportLogical(10, 9));
    await clickWorld(page, point);
    const command = await page.evaluate(() => window.__lexiconDebug!.pointerState());
    expect(command?.status, JSON.stringify({ viewport, command })).toBe('found');
    expect(command?.targetId).toBeNull();
    expect(
      Math.hypot(command!.x - point.x, command!.y - point.y),
      JSON.stringify({ viewport, command }),
    ).toBeLessThanOrEqual(2);
    await expect
      .poll(async () => {
        const p = await page.evaluate(() => window.__lexiconDebug!.player());
        return Math.hypot(p.x - point.x, p.y - point.y);
      })
      .toBeLessThanOrEqual(3);
  }
});
