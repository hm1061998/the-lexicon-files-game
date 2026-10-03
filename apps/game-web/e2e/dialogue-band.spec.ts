import { expect, test, type Page } from '@playwright/test';
import { openWorld, pressInteract } from './journeyHelpers';
import { scenePoint } from './sceneTestData';

// The interrogation band: typed line, numbered choices, camera push-in. These tests keep the
// default typing speed (`normal`) because the speed is the thing under test.

async function startAnna(page: Page): Promise<void> {
  await openWorld(page, { textSpeed: 'normal' });
  await page.evaluate(
    ({ x, y }) => window.__lexiconDebug!.teleport(x, y),
    scenePoint('main_office', 'anna', { u: 0.3, v: 0.6 }),
  );
  await expect(page.getByText('Nói chuyện với Anna', { exact: true })).toBeVisible();
  await pressInteract(page);
  await expect(page.locator('.dialogue-panel')).toBeVisible();
}

const zoom = (page: Page) => page.evaluate(() => window.__lexiconDebug!.cameraZoom());
const baseZoom = (page: Page) => page.evaluate(() => window.__lexiconDebug!.cameraBaseZoom());

test.describe('Dialogue band', () => {
  test.setTimeout(90_000);

  test('Space finishes the typed line, then the numbers choose', async ({ page }) => {
    await startAnna(page);
    const text = page.locator('.dialogue-text');
    await expect(page.locator('.dialogue-choice')).toHaveCount(0);
    await page.keyboard.press(' ');
    await expect(text).toContainText('I had a call with a client.');
    await expect(page.locator('.dialogue-choice')).toHaveCount(3);
    await expect(page.locator('.dialogue-choice__key').first()).toHaveText('1');
    await page.keyboard.press('2');
    await expect(page.locator('.dialogue-panel')).toContainText('No. I went directly to my desk.', {
      timeout: 10_000,
    });
  });

  test('pressing Space ten times fast never skips a choice or a node', async ({ page }) => {
    await startAnna(page);
    for (let i = 0; i < 10; i += 1) await page.keyboard.press(' ');
    await expect(page.locator('.dialogue-choice')).toHaveCount(3);
    await expect(page.locator('.dialogue-text')).toContainText('I left the meeting early.');
  });

  test('the camera pushes in by 20 percent and returns on close, even when closed at once', async ({
    page,
  }) => {
    await openWorld(page);
    const base = await baseZoom(page);
    expect(Math.abs((await zoom(page)) - base)).toBeLessThan(0.02);
    await page.evaluate(
      ({ x, y }) => window.__lexiconDebug!.teleport(x, y),
      scenePoint('main_office', 'anna', { u: 0.3, v: 0.6 }),
    );
    await expect(page.getByText('Nói chuyện với Anna', { exact: true })).toBeVisible();
    await pressInteract(page);
    await expect.poll(() => zoom(page), { timeout: 5000 }).toBeGreaterThan(base * 1.18);
    expect(Math.abs((await zoom(page)) / base - 1.2)).toBeLessThan(0.03);
    await page.getByRole('button', { name: 'Đóng', exact: true }).click();
    await expect
      .poll(async () => Math.abs((await zoom(page)) - base), { timeout: 5000 })
      .toBeLessThan(0.02);

    // Closing within the first 100 ms of the push-in must not leave the camera zoomed.
    await pressInteract(page);
    await expect(page.locator('.dialogue-panel')).toBeVisible();
    await page.waitForTimeout(80);
    await page.getByRole('button', { name: 'Đóng', exact: true }).click();
    await expect
      .poll(async () => Math.abs((await zoom(page)) - base), { timeout: 5000 })
      .toBeLessThan(0.02);
  });

  test('the HUD steps aside while the band is open', async ({ page }) => {
    await startAnna(page);
    await expect(page.locator('.hud')).toHaveCSS('visibility', 'hidden');
    await page.getByRole('button', { name: 'Đóng', exact: true }).click();
    await expect(page.locator('.hud')).toHaveCSS('visibility', 'visible');
  });
});
