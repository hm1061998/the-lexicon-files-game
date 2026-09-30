import { expect, test } from '@playwright/test';
import { scenePoint } from './sceneTestData';

test('collected evidence no longer prompts for another E interaction', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await page.waitForFunction(() => window.__lexiconDebug !== undefined);
  const recording = scenePoint('main_office', 'phone_recording');
  await page.evaluate(({ x, y }) => window.__lexiconDebug!.teleport(x, y), recording);

  const prompt = page.locator('.hud-interaction-prompt');
  await expect(prompt).toBeVisible();
  await page.keyboard.press('e');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Đóng' }).click();
  await expect(prompt).toBeVisible();
  await expect(prompt).toContainText('Đọc biên bản cuộc họp');
  await expect
    .poll(() => page.evaluate(() => window.__lexiconDebug!.nearby()))
    .toBe('meeting_minutes');
});
